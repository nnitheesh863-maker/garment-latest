import time
import threading
from functools import wraps
from collections import OrderedDict
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

from config import Config, setup_logging
from utils.preprocessor import (
    preprocess_order_data, preprocess_employee_data,
    preprocess_machine_data
)

logger = setup_logging(__name__)


class TTLCache:
    def __init__(self, ttl_seconds=300, max_size=100):
        self.cache = OrderedDict()
        self.ttl = ttl_seconds
        self.max_size = max_size
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            if key in self.cache:
                entry = self.cache[key]
                if time.time() - entry['timestamp'] < self.ttl:
                    self.cache.move_to_end(key)
                    return entry['value']
                else:
                    del self.cache[key]
            return None

    def set(self, key, value):
        with self._lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = {'value': value, 'timestamp': time.time()}
            while len(self.cache) > self.max_size:
                self.cache.popitem(last=False)

    def clear(self):
        with self._lock:
            self.cache.clear()

    def invalidate(self, key):
        with self._lock:
            self.cache.pop(key, None)


_prediction_cache = TTLCache(ttl_seconds=Config.CACHE_TTL_SECONDS)


class PredictionService:
    def __init__(self, production_model, delay_model, performance_analyzer, failure_model):
        self.production_model = production_model
        self.delay_model = delay_model
        self.performance_analyzer = performance_analyzer
        self.failure_model = failure_model

    def get_production_forecast(self, params):
        cache_key = f"prod_forecast:{hash(frozenset(params.items()))}"
        cached = _prediction_cache.get(cache_key)
        if cached:
            logger.debug("Returning cached production forecast")
            return cached

        df = preprocess_order_data([params] if isinstance(params, dict) else params)
        result = self.production_model.predict(df)

        if isinstance(result, list):
            result = result[0]

        enriched = {
            'forecast': result,
            'model_version': self.production_model.version,
            'generated_at': datetime.now().isoformat(),
            'model_accuracy': {
                'r2_score': self.production_model.r2_score,
                'mae': self.production_model.mae
            }
        }

        _prediction_cache.set(cache_key, enriched)
        return enriched

    def get_delay_prediction(self, order_data):
        cache_key = f"delay_pred:{hash(frozenset(order_data.items()))}"
        cached = _prediction_cache.get(cache_key)
        if cached:
            logger.debug("Returning cached delay prediction")
            return cached

        df = preprocess_order_data([order_data] if isinstance(order_data, dict) else order_data)
        result = self.delay_model.predict(df)

        if isinstance(result, list):
            result = result[0]

        enriched = {
            'prediction': result,
            'model_version': self.delay_model.version,
            'generated_at': datetime.now().isoformat(),
            'model_accuracy': {
                'accuracy': self.delay_model.accuracy,
                'auc_roc': self.delay_model.auc_roc
            }
        }

        _prediction_cache.set(cache_key, enriched)
        return enriched

    def get_performance_analysis(self, employee_data):
        df = preprocess_employee_data(employee_data)
        results = self.performance_analyzer.analyze_performance(df)

        enriched = {
            'employees': results,
            'summary': self._compute_performance_summary(results),
            'model_version': self.performance_analyzer.version,
            'generated_at': datetime.now().isoformat()
        }

        return enriched

    def get_failure_prediction(self, machine_data):
        df = preprocess_machine_data([machine_data] if isinstance(machine_data, dict) else machine_data)
        result = self.failure_model.predict(df)

        if isinstance(result, list):
            result = result[0]

        enriched = {
            'prediction': result,
            'model_version': self.failure_model.version,
            'generated_at': datetime.now().isoformat(),
            'model_accuracy': {
                'accuracy': self.failure_model.accuracy,
                'auc_roc': self.failure_model.auc_roc
            }
        }

        return enriched

    def get_recommendations(self, resource_data):
        production = resource_data.get('production', {})
        employees = resource_data.get('employees', [])
        machines = resource_data.get('machines', [])
        orders = resource_data.get('orders', [])

        recommendations = []

        if production:
            forecast = self.get_production_forecast(production) if self.production_model.model else None
            if forecast:
                rec = self._generate_production_recs(forecast)
                recommendations.extend(rec)

        if orders and self.delay_model.model:
            for order in orders[:10]:
                delay_pred = self.get_delay_prediction(order)
                if delay_pred['prediction']['delay_probability'] > 50:
                    recommendations.append({
                        'type': 'delay_risk',
                        'priority': 'high',
                        'order_details': order.get('order_id', 'Unknown'),
                        'probability': delay_pred['prediction']['delay_probability'],
                        'actions': delay_pred['prediction']['recommended_actions']
                    })

        if employees:
            perf = self.get_performance_analysis(employees)
            low_performers = [e for e in perf['employees'] if e['overall_score'] < 70]
            for emp in low_performers[:5]:
                recommendations.append({
                    'type': 'employee_improvement',
                    'priority': 'medium',
                    'employee_id': emp['employee_id'],
                    'employee_name': emp['employee_name'],
                    'overall_score': emp['overall_score'],
                    'actions': [r['suggestion'] for r in emp['recommendations']]
                })

        if machines and self.failure_model.model:
            for machine in machines[:10]:
                failure_pred = self.get_failure_prediction(machine)
                if failure_pred['prediction']['failure_probability'] > 50:
                    recommendations.append({
                        'type': 'maintenance_alert',
                        'priority': 'critical' if failure_pred['prediction']['failure_probability'] > 70 else 'high',
                        'machine_details': machine.get('machine_id', 'Unknown'),
                        'probability': failure_pred['prediction']['failure_probability'],
                        'estimated_ttf_days': failure_pred['prediction']['estimated_ttf_days'],
                        'actions': failure_pred['prediction']['required_maintenance']
                    })

        if not recommendations:
            recommendations.append({
                'type': 'status_ok',
                'priority': 'low',
                'message': 'All resources operating within normal parameters'
            })

        return {
            'recommendations': sorted(recommendations, key=lambda r: {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}.get(r.get('priority', 'low'), 4)),
            'total_count': len(recommendations),
            'generated_at': datetime.now().isoformat()
        }

    def aggregate_analysis(self, data):
        production_params = data.get('production', {})
        order_data = data.get('orders', [])
        employee_data = data.get('employees', [])
        machine_data = data.get('machines', [])

        results = {}

        if production_params and self.production_model.model:
            results['production_forecast'] = self.get_production_forecast(production_params)

        if order_data and self.delay_model.model:
            delays = []
            for order in (order_data if isinstance(order_data, list) else [order_data]):
                delays.append(self.get_delay_prediction(order))
            results['delay_predictions'] = delays
            if delays:
                avg_prob = np.mean([d['prediction']['delay_probability'] for d in delays])
                results['delay_summary'] = {
                    'average_delay_probability': round(float(avg_prob), 2),
                    'orders_at_risk': sum(1 for d in delays if d['prediction']['delay_probability'] > 50),
                    'total_orders_analyzed': len(delays)
                }

        if employee_data:
            perf = self.get_performance_analysis(employee_data)
            results['performance_analysis'] = perf

        if machine_data and self.failure_model.model:
            failures = []
            for machine in (machine_data if isinstance(machine_data, list) else [machine_data]):
                failures.append(self.get_failure_prediction(machine))
            results['failure_predictions'] = failures
            if failures:
                avg_fail_prob = np.mean([f['prediction']['failure_probability'] for f in failures])
                results['failure_summary'] = {
                    'average_failure_probability': round(float(avg_fail_prob), 2),
                    'machines_at_risk': sum(1 for f in failures if f['prediction']['failure_probability'] > 50),
                    'total_machines_analyzed': len(failures),
                    'earliest_ttf_days': min(f['prediction']['estimated_ttf_days'] for f in failures)
                }

        results['recommendations'] = self.get_recommendations(data)
        results['analysis_timestamp'] = datetime.now().isoformat()

        return results

    def get_dashboard_data(self):
        dashboard = {
            'model_status': {
                'production_forecast': {
                    'status': 'ready' if self.production_model.model else 'untrained',
                    'r2_score': self.production_model.r2_score,
                    'last_trained': self.production_model.last_trained
                },
                'delay_prediction': {
                    'status': 'ready' if self.delay_model.model else 'untrained',
                    'accuracy': self.delay_model.accuracy,
                    'last_trained': self.delay_model.last_trained
                },
                'failure_prediction': {
                    'status': 'ready' if self.failure_model.model else 'untrained',
                    'accuracy': self.failure_model.accuracy,
                    'last_trained': self.failure_model.last_trained
                },
                'performance_analysis': {
                    'status': 'ready',
                    'version': self.performance_analyzer.version
                }
            },
            'cache_stats': {
                'current_size': len(_prediction_cache.cache),
                'ttl_seconds': _prediction_cache.ttl,
                'max_size': _prediction_cache.max_size
            },
            'system': {
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0'
            }
        }

        if all([
            self.production_model.model,
            self.delay_model.model,
            self.failure_model.model
        ]):
            dashboard['overall_status'] = 'operational'
        elif any([
            self.production_model.model,
            self.delay_model.model,
            self.failure_model.model
        ]):
            dashboard['overall_status'] = 'degraded'
        else:
            dashboard['overall_status'] = 'untrained'

        return dashboard

    def _compute_performance_summary(self, results):
        if not results:
            return {}
        scores = [e['overall_score'] for e in results]
        return {
            'average_score': round(float(np.mean(scores)), 2),
            'min_score': round(float(np.min(scores)), 2),
            'max_score': round(float(np.max(scores)), 2),
            'std_dev': round(float(np.std(scores)), 2),
            'total_employees_analyzed': len(results),
            'high_performers': sum(1 for s in scores if s >= 85),
            'needs_improvement': sum(1 for s in scores if s < 70)
        }

    def _generate_production_recs(self, forecast):
        recs = []
        f = forecast['forecast']
        ci = f.get('confidence_interval', {})
        lower = ci.get('lower', 0)
        upper = ci.get('upper', 0)

        if f.get('trend_direction') == 'downward':
            recs.append({
                'type': 'production_planning',
                'priority': 'high',
                'message': 'Production capacity trending downward',
                'suggestion': 'Review resource allocation and consider adding shifts'
            })

        if upper - lower > 500:
            recs.append({
                'type': 'forecast_uncertainty',
                'priority': 'medium',
                'message': f'High forecast uncertainty (range: {lower:.0f}-{upper:.0f})',
                'suggestion': 'Increase data collection frequency to improve accuracy'
            })

        return recs

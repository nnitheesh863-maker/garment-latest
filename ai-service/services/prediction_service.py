"""
Prediction Orchestration Service
================================
Coordinates inference pipelines across all models (Production Forecast,
Order Delay Prediction, Machine Predictive Maintenance, Workforce Analytics).
Includes a thread-safe LRU/TTL caching layer and aggregate insight generators.
"""

import threading
import time
from collections import OrderedDict
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

import numpy as np
import pandas as pd

from config import Config, setup_logging
from utils.preprocessor import (
    preprocess_order_data,
    preprocess_employee_data,
    preprocess_machine_data
)

logger = setup_logging(__name__)


# =====================================================================
# Thread-Safe In-Memory Cache with Time-To-Live (TTL) & LRU Eviction
# =====================================================================

class TTLCache:
    """
    Thread-safe in-memory cache supporting time-based expiration and
    Least Recently Used (LRU) size bounding.
    """

    def __init__(self, ttl_seconds: int = 300, max_size: int = 100):
        """
        Initializes the cache.

        Args:
            ttl_seconds (int): Lifespan of each cached entry in seconds.
            max_size (int): Maximum number of entries stored before eviction.
        """
        self.cache: OrderedDict = OrderedDict()
        self.ttl: int = ttl_seconds
        self.max_size: int = max_size
        self._lock: threading.Lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Retrieves a cached value if present and not expired."""
        with self._lock:
            if key in self.cache:
                entry = self.cache[key]
                if time.time() - entry['timestamp'] < self.ttl:
                    self.cache.move_to_end(key)
                    return entry['value']
                else:
                    del self.cache[key]
            return None

    def set(self, key: str, value: Any) -> None:
        """Stores a value with current timestamp and evicts oldest if size exceeds limit."""
        with self._lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = {'value': value, 'timestamp': time.time()}
            while len(self.cache) > self.max_size:
                self.cache.popitem(last=False)

    def clear(self) -> None:
        """Clears all stored entries."""
        with self._lock:
            self.cache.clear()

    def invalidate(self, key: str) -> None:
        """Removes a specific key from the cache."""
        with self._lock:
            self.cache.pop(key, None)


# Global singleton cache instance for predictions
_prediction_cache = TTLCache(ttl_seconds=Config.CACHE_TTL_SECONDS)


# =====================================================================
# Main Prediction Service Engine
# =====================================================================

class PredictionService:
    """
    Central service coordinating AI inference, data pre-processing,
    caching, error encapsulation, and cross-domain operational recommendations.
    """

    def __init__(self, production_model, delay_model, performance_analyzer, failure_model):
        """
        Initializes the Prediction Service with model instances.

        Args:
            production_model: Instance of ProductionForecast.
            delay_model: Instance of DelayPrediction.
            performance_analyzer: Instance of PerformanceAnalysis.
            failure_model: Instance of FailurePrediction.
        """
        self.production_model = production_model
        self.delay_model = delay_model
        self.performance_analyzer = performance_analyzer
        self.failure_model = failure_model

    def get_production_forecast(self, params: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Generates production forecast with 95% confidence intervals and accuracy metadata.

        Args:
            params: Production parameters dictionary (or list of dicts).

        Returns:
            Dict[str, Any]: Forecast result with model metrics and timestamp.
        """
        # Generate cache key based on parameter content
        param_items = frozenset(sorted(params.items())) if isinstance(params, dict) else str(params)
        cache_key = f"prod_forecast:{hash(param_items)}"

        cached = _prediction_cache.get(cache_key)
        if cached:
            logger.debug("Cache hit for production forecast")
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
                'r2_score': round(self.production_model.r2_score, 4),
                'mae': round(self.production_model.mae, 2),
                'rmse': round(self.production_model.rmse, 2)
            }
        }

        _prediction_cache.set(cache_key, enriched)
        return enriched

    def get_delay_prediction(self, order_data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Calculates order delay risk, severity, bottleneck causes, and actions.

        Args:
            order_data: Order attributes dictionary.

        Returns:
            Dict[str, Any]: Prediction payload with model version and accuracy.
        """
        param_items = frozenset(sorted(order_data.items())) if isinstance(order_data, dict) else str(order_data)
        cache_key = f"delay_pred:{hash(param_items)}"

        cached = _prediction_cache.get(cache_key)
        if cached:
            logger.debug("Cache hit for delay prediction")
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
                'accuracy': round(self.delay_model.accuracy, 4),
                'auc_roc': round(self.delay_model.auc_roc, 4)
            }
        }

        _prediction_cache.set(cache_key, enriched)
        return enriched

    def get_performance_analysis(
        self,
        employee_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]
    ) -> Dict[str, Any]:
        """
        Performs workforce evaluation, skill gap extraction, and summary statistics.

        Args:
            employee_data: Single employee record, list of records, or DataFrame.

        Returns:
            Dict[str, Any]: Employee evaluation list and workforce summary metrics.
        """
        df = preprocess_employee_data(employee_data)
        results = self.performance_analyzer.analyze_performance(df)

        enriched = {
            'employees': results,
            'summary': self._compute_performance_summary(results),
            'model_version': self.performance_analyzer.version,
            'generated_at': datetime.now().isoformat()
        }

        return enriched

    def get_failure_prediction(self, machine_data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Predicts machine failure probabilities, Time-To-Failure (TTF), and sensor flags.

        Args:
            machine_data: Machine telemetry dictionary.

        Returns:
            Dict[str, Any]: Failure risk payload with diagnostic actions.
        """
        df = preprocess_machine_data([machine_data] if isinstance(machine_data, dict) else machine_data)
        result = self.failure_model.predict(df)

        if isinstance(result, list):
            result = result[0]

        enriched = {
            'prediction': result,
            'model_version': self.failure_model.version,
            'generated_at': datetime.now().isoformat(),
            'model_accuracy': {
                'accuracy': round(self.failure_model.accuracy, 4),
                'auc_roc': round(self.failure_model.auc_roc, 4)
            }
        }

        return enriched

    def get_recommendations(self, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesizes recommendations across Production, Orders, Staff, and Machines.
        Sorts actions by priority: Critical > High > Medium > Low.

        Args:
            resource_data: Combined dictionary of plant resources.

        Returns:
            Dict[str, Any]: Prioritized list of actionable recommendations.
        """
        production = resource_data.get('production', {})
        employees = resource_data.get('employees', [])
        machines = resource_data.get('machines', [])
        orders = resource_data.get('orders', [])

        recommendations = []

        # 1. Production Forecast Insights
        if production and self.production_model.model:
            try:
                forecast = self.get_production_forecast(production)
                rec = self._generate_production_recs(forecast)
                recommendations.extend(rec)
            except Exception as e:
                logger.warning(f"Could not generate production recommendations: {e}")

        # 2. Order Delay Risks
        if orders and self.delay_model.model:
            order_list = orders if isinstance(orders, list) else [orders]
            for order in order_list[:10]:
                try:
                    delay_pred = self.get_delay_prediction(order)
                    prob = delay_pred['prediction']['delay_probability']
                    if prob > 50.0:
                        recommendations.append({
                            'type': 'delay_risk',
                            'priority': 'critical' if prob > 75.0 else 'high',
                            'order_details': order.get('order_id', order.get('order_number', 'Unknown Order')),
                            'probability': prob,
                            'actions': delay_pred['prediction']['recommended_actions']
                        })
                except Exception as e:
                    logger.warning(f"Error predicting delay for order: {e}")

        # 3. Employee Support & Training Alerts
        if employees:
            try:
                perf = self.get_performance_analysis(employees)
                low_performers = [e for e in perf['employees'] if e['overall_score'] < 70.0]
                for emp in low_performers[:5]:
                    recommendations.append({
                        'type': 'employee_improvement',
                        'priority': 'medium',
                        'employee_id': emp['employee_id'],
                        'employee_name': emp['employee_name'],
                        'overall_score': emp['overall_score'],
                        'actions': [r['suggestion'] for r in emp['recommendations']]
                    })
            except Exception as e:
                logger.warning(f"Error evaluating employees for recommendations: {e}")

        # 4. Machine Failure Alerts
        if machines and self.failure_model.model:
            machine_list = machines if isinstance(machines, list) else [machines]
            for machine in machine_list[:10]:
                try:
                    failure_pred = self.get_failure_prediction(machine)
                    prob = failure_pred['prediction']['failure_probability']
                    if prob > 40.0:
                        recommendations.append({
                            'type': 'maintenance_alert',
                            'priority': 'critical' if prob > 70.0 else 'high',
                            'machine_details': machine.get('machine_id', machine.get('code', 'Unknown Machine')),
                            'probability': prob,
                            'estimated_ttf_days': failure_pred['prediction']['estimated_ttf_days'],
                            'actions': failure_pred['prediction']['required_maintenance']
                        })
                except Exception as e:
                    logger.warning(f"Error predicting machine failure: {e}")

        # Default fallback if all systems are healthy
        if not recommendations:
            recommendations.append({
                'type': 'status_ok',
                'priority': 'low',
                'message': 'All production lines, orders, machines, and staff are operating within target parameters.'
            })

        # Sort recommendations by priority weight
        priority_rank = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda r: priority_rank.get(str(r.get('priority', 'low')).lower(), 4))

        return {
            'recommendations': recommendations,
            'total_count': len(recommendations),
            'generated_at': datetime.now().isoformat()
        }

    def aggregate_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a holistic factory analysis combining forecasts, delay evaluations,
        workforce indicators, machine health, and cross-cutting recommendations.

        Args:
            data: Composite JSON payload from front-end / backend.

        Returns:
            Dict[str, Any]: Aggregated dashboard intelligence.
        """
        production_params = data.get('production', {})
        order_data = data.get('orders', [])
        employee_data = data.get('employees', [])
        machine_data = data.get('machines', [])

        results = {}

        # 1. Production Forecasting
        if production_params and self.production_model.model:
            results['production_forecast'] = self.get_production_forecast(production_params)

        # 2. Batch Order Delays
        if order_data and self.delay_model.model:
            orders = order_data if isinstance(order_data, list) else [order_data]
            delays = [self.get_delay_prediction(o) for o in orders]
            results['delay_predictions'] = delays
            if delays:
                probs = [d['prediction']['delay_probability'] for d in delays]
                results['delay_summary'] = {
                    'average_delay_probability': round(float(np.mean(probs)), 2),
                    'orders_at_risk': sum(1 for p in probs if p > 50.0),
                    'total_orders_analyzed': len(delays)
                }

        # 3. Workforce Analytics
        if employee_data:
            results['performance_analysis'] = self.get_performance_analysis(employee_data)

        # 4. Machine Diagnostics
        if machine_data and self.failure_model.model:
            machines = machine_data if isinstance(machine_data, list) else [machine_data]
            failures = [self.get_failure_prediction(m) for m in machines]
            results['failure_predictions'] = failures
            if failures:
                fail_probs = [f['prediction']['failure_probability'] for f in failures]
                results['failure_summary'] = {
                    'average_failure_probability': round(float(np.mean(fail_probs)), 2),
                    'machines_at_risk': sum(1 for p in fail_probs if p > 40.0),
                    'total_machines_analyzed': len(failures),
                    'earliest_ttf_days': min(f['prediction']['estimated_ttf_days'] for f in failures)
                }

        # 5. Holistic Cross-Resource Recommendations
        results['recommendations'] = self.get_recommendations(data)
        results['analysis_timestamp'] = datetime.now().isoformat()

        return results

    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Returns live operational readiness, model performance stats, and cache health.

        Returns:
            Dict[str, Any]: System health telemetry.
        """
        dashboard = {
            'model_status': {
                'production_forecast': {
                    'status': 'ready' if self.production_model.model else 'untrained',
                    'r2_score': round(self.production_model.r2_score, 4),
                    'last_trained': self.production_model.last_trained
                },
                'delay_prediction': {
                    'status': 'ready' if self.delay_model.model else 'untrained',
                    'accuracy': round(self.delay_model.accuracy, 4),
                    'last_trained': self.delay_model.last_trained
                },
                'failure_prediction': {
                    'status': 'ready' if self.failure_model.model else 'untrained',
                    'accuracy': round(self.failure_model.accuracy, 4),
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

        # Compute overall system readiness
        all_models_ready = all([
            self.production_model.model is not None,
            self.delay_model.model is not None,
            self.failure_model.model is not None
        ])
        any_model_ready = any([
            self.production_model.model is not None,
            self.delay_model.model is not None,
            self.failure_model.model is not None
        ])

        if all_models_ready:
            dashboard['overall_status'] = 'operational'
        elif any_model_ready:
            dashboard['overall_status'] = 'degraded'
        else:
            dashboard['overall_status'] = 'untrained'

        return dashboard

    def _compute_performance_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates statistical summary for an analyzed employee cohort."""
        if not results:
            return {}
        scores = [e['overall_score'] for e in results]
        return {
            'average_score': round(float(np.mean(scores)), 2),
            'min_score': round(float(np.min(scores)), 2),
            'max_score': round(float(np.max(scores)), 2),
            'std_dev': round(float(np.std(scores)), 2),
            'total_employees_analyzed': len(results),
            'high_performers': sum(1 for s in scores if s >= 85.0),
            'needs_improvement': sum(1 for s in scores if s < 70.0)
        }

    def _generate_production_recs(self, forecast: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extracts production planning adjustments from forecasted trends."""
        recs = []
        f = forecast.get('forecast', {})
        ci = f.get('confidence_interval', {})
        lower = ci.get('lower', 0)
        upper = ci.get('upper', 0)

        if f.get('trend_direction') == 'downward':
            recs.append({
                'type': 'production_planning',
                'priority': 'high',
                'message': 'Factory capacity projected on downward trend for upcoming period',
                'suggestion': 'Review line worker allocation, minimize bottleneck changeovers, or schedule second shift'
            })

        if upper - lower > 500:
            recs.append({
                'type': 'forecast_uncertainty',
                'priority': 'medium',
                'message': f'High production variance detected (Confidence interval: {lower:.0f} - {upper:.0f} units)',
                'suggestion': 'Increase daily cut & stitch tracking frequency to tighten forecast confidence'
            })

        return recs

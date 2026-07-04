import os
import threading
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from config import Config, setup_logging
from models.production_forecast import ProductionForecast
from models.delay_prediction import DelayPrediction
from models.failure_prediction import FailurePrediction

logger = setup_logging(__name__)


class TrainingService:
    def __init__(self, production_model, delay_model, performance_analyzer, failure_model):
        self.production_model = production_model
        self.delay_model = delay_model
        self.performance_analyzer = performance_analyzer
        self.failure_model = failure_model
        self._training_lock = threading.Lock()
        self._training_status = {
            'production_forecast': {'status': 'idle', 'last_trained': None, 'error': None},
            'delay_prediction': {'status': 'idle', 'last_trained': None, 'error': None},
            'failure_prediction': {'status': 'idle', 'last_trained': None, 'error': None},
        }
        self._model_dir = Config.MODEL_DIR
        os.makedirs(self._model_dir, exist_ok=True)

    def _generate_sample_production_data(self, n=500):
        np.random.seed(42)
        dates = pd.date_range(start='2023-01-01', periods=n, freq='D')
        data = pd.DataFrame({
            'order_date': dates,
            'employee_count': np.random.randint(30, 100, n),
            'machine_count': np.random.randint(10, 30, n),
            'order_volume': np.random.randint(500, 5000, n),
            'actual_quantity': np.random.randint(400, 4800, n),
            'order_quantity': np.random.randint(500, 5000, n),
            'order_complexity': np.random.randint(1, 10, n),
            'production_capacity': np.random.randint(4000, 6000, n),
        })
        data['day_of_week'] = data['order_date'].dt.dayofweek
        data['month'] = data['order_date'].dt.month
        trend = np.linspace(0, 500, n)
        noise = np.random.normal(0, 200, n)
        data['actual_quantity'] = (
            data['order_volume'] * 0.85 +
            data['employee_count'] * 5 +
            data['machine_count'] * 20 +
            trend + noise
        ).clip(300, 5500).astype(int)
        return data

    def _generate_sample_delay_data(self, n=500):
        np.random.seed(43)
        data = pd.DataFrame({
            'order_complexity': np.random.randint(1, 10, n),
            'employee_experience': np.random.uniform(0.5, 10, n),
            'machine_health': np.random.uniform(0.3, 1.0, n),
            'material_availability': np.random.uniform(0.4, 1.0, n),
            'workload': np.random.uniform(20, 100, n),
            'order_quantity': np.random.randint(100, 5000, n),
            'lead_time_days': np.random.randint(5, 45, n),
        })
        delay_prob = (
            0.3 * (data['order_complexity'] / 10) +
            0.25 * (1 - data['machine_health']) +
            0.2 * (1 - data['material_availability']) +
            0.15 * (data['workload'] / 100) +
            0.1 * (1 - data['employee_experience'] / 10)
        )
        data['delayed'] = (delay_prob + np.random.uniform(-0.15, 0.15, n) > 0.35).astype(int)
        data['delay_days'] = data['delayed'] * np.random.randint(1, 15, n)
        return data

    def _generate_sample_machine_data(self, n=300):
        np.random.seed(44)
        data = pd.DataFrame({
            'temperature': np.random.uniform(50, 100, n),
            'vibration': np.random.uniform(0.1, 1.2, n),
            'speed': np.random.uniform(50, 200, n),
            'power_usage': np.random.uniform(20, 100, n),
            'hours_since_maintenance': np.random.uniform(0, 2000, n),
            'age_days': np.random.randint(30, 2000, n),
            'operating_hours': np.random.uniform(100, 5000, n),
        })
        failure_score = (
            0.2 * (data['temperature'] / 100) +
            0.3 * data['vibration'] +
            0.1 * (1 - data['speed'] / 200) +
            0.15 * (data['power_usage'] / 100) +
            0.25 * (1 - np.exp(-data['hours_since_maintenance'] / 500))
        )
        data['failure'] = (failure_score + np.random.uniform(-0.1, 0.1, n) > 0.5).astype(int)
        return data

    def train_production_model(self, data=None):
        logger.info("Starting production forecast model training")
        self._training_status['production_forecast']['status'] = 'training'
        self._training_status['production_forecast']['error'] = None
        try:
            if data is None:
                data = self._generate_sample_production_data()
            metrics = self.production_model.train(data)
            self.production_model.save(self._model_dir)
            self._training_status['production_forecast']['status'] = 'ready'
            self._training_status['production_forecast']['last_trained'] = self.production_model.last_trained
            self._training_status['production_forecast']['metrics'] = metrics
            logger.info(f"Production forecast model trained successfully: R2={metrics.get('r2_score', 0):.4f}")
            return metrics
        except Exception as e:
            logger.error(f"Production model training failed: {e}")
            self._training_status['production_forecast']['status'] = 'error'
            self._training_status['production_forecast']['error'] = str(e)
            raise

    def train_delay_model(self, data=None):
        logger.info("Starting delay prediction model training")
        self._training_status['delay_prediction']['status'] = 'training'
        self._training_status['delay_prediction']['error'] = None
        try:
            if data is None:
                data = self._generate_sample_delay_data()
            metrics = self.delay_model.train(data)
            self.delay_model.save(self._model_dir)
            self._training_status['delay_prediction']['status'] = 'ready'
            self._training_status['delay_prediction']['last_trained'] = self.delay_model.last_trained
            self._training_status['delay_prediction']['metrics'] = metrics
            logger.info(f"Delay prediction model trained successfully: AUC={metrics.get('auc_roc', 0):.4f}")
            return metrics
        except Exception as e:
            logger.error(f"Delay model training failed: {e}")
            self._training_status['delay_prediction']['status'] = 'error'
            self._training_status['delay_prediction']['error'] = str(e)
            raise

    def train_failure_model(self, data=None):
        logger.info("Starting failure prediction model training")
        self._training_status['failure_prediction']['status'] = 'training'
        self._training_status['failure_prediction']['error'] = None
        try:
            if data is None:
                data = self._generate_sample_machine_data()
            metrics = self.failure_model.train(data)
            self.failure_model.save(self._model_dir)
            self._training_status['failure_prediction']['status'] = 'ready'
            self._training_status['failure_prediction']['last_trained'] = self.failure_model.last_trained
            self._training_status['failure_prediction']['metrics'] = metrics
            logger.info(f"Failure prediction model trained successfully: AUC={metrics.get('auc_roc', 0):.4f}")
            return metrics
        except Exception as e:
            logger.error(f"Failure model training failed: {e}")
            self._training_status['failure_prediction']['status'] = 'error'
            self._training_status['failure_prediction']['error'] = str(e)
            raise

    def train_all_models(self, production_data=None, delay_data=None, machine_data=None):
        logger.info("Starting training for all models")
        results = {}
        with self._training_lock:
            results['production_forecast'] = self.train_production_model(production_data)
            results['delay_prediction'] = self.train_delay_model(delay_data)
            results['failure_prediction'] = self.train_failure_model(machine_data)
        logger.info("All models trained successfully")
        return results

    def load_models(self):
        logger.info("Loading saved models from disk")
        results = {}
        results['production_forecast'] = self.production_model.load(self._model_dir)
        results['delay_prediction'] = self.delay_model.load(self._model_dir)
        results['failure_prediction'] = self.failure_model.load(self._model_dir)
        loaded = sum(1 for v in results.values() if v)
        logger.info(f"Loaded {loaded}/3 models from {self._model_dir}")
        for name, success in results.items():
            if success:
                self._training_status[name]['status'] = 'ready'
                self._training_status[name]['last_trained'] = getattr(
                    self._get_model(name), 'last_trained', None
                )
        return results

    def save_models(self):
        logger.info("Saving all models to disk")
        results = {}
        results['production_forecast'] = self.production_model.save(self._model_dir)
        results['delay_prediction'] = self.delay_model.save(self._model_dir)
        results['failure_prediction'] = self.failure_model.save(self._model_dir)
        logger.info("All models saved")
        return results

    def _get_model(self, name):
        mapping = {
            'production_forecast': self.production_model,
            'delay_prediction': self.delay_model,
            'failure_prediction': self.failure_model,
        }
        return mapping.get(name)

    def get_model_status(self):
        status = {}
        for model_name, model in [
            ('production_forecast', self.production_model),
            ('delay_prediction', self.delay_model),
            ('failure_prediction', self.failure_model),
        ]:
            training_info = self._training_status.get(model_name, {})
            status[model_name] = {
                'model_loaded': model.model is not None,
                'version': model.version,
                'last_trained': model.last_trained,
                'training_status': training_info.get('status', 'unknown'),
                'error': training_info.get('error'),
                'metrics': {
                    'r2_score': getattr(model, 'r2_score', 0),
                    'accuracy': getattr(model, 'accuracy', 0),
                    'precision': getattr(model, 'precision', 0),
                    'recall': getattr(model, 'recall', 0),
                    'f1': getattr(model, 'f1', 0),
                    'auc_roc': getattr(model, 'auc_roc', 0),
                    'mae': getattr(model, 'mae', 0),
                    'rmse': getattr(model, 'rmse', 0),
                }
            }

        status['performance_analysis'] = {
            'model_loaded': True,
            'version': self.performance_analyzer.version,
            'training_status': 'ready',
            'type': 'statistical (no ML model)'
        }

        status['model_dir'] = self._model_dir
        status['models_available'] = sum(
            1 for s in status.values() if isinstance(s, dict) and s.get('model_loaded')
        )
        return status

    def schedule_retraining(self, interval_hours=24):
        def retrain_loop():
            logger.info(f"Scheduled retraining started (interval: {interval_hours}h)")
            while True:
                try:
                    time.sleep(interval_hours * 3600)
                    logger.info("Running scheduled retraining")
                    self.train_all_models()
                except Exception as e:
                    logger.error(f"Scheduled retraining failed: {e}")

        thread = threading.Thread(target=retrain_loop, daemon=True)
        thread.start()
        logger.info(f"Scheduled retraining every {interval_hours}h started")
        return thread

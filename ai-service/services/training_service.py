"""
Model Training & Lifecycle Management Service
============================================
Handles asynchronous model training, synthetic bootstrapping data generation,
model persistence, version tracking, and background retraining scheduling.
"""

import os
import threading
import time
from datetime import datetime
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd

from config import Config, setup_logging

logger = setup_logging(__name__)


class TrainingService:
    """
    Manages the lifecycle, bootstrapping, training execution,
    and automatic periodic retraining of factory machine learning models.
    """

    def __init__(self, production_model, delay_model, performance_analyzer, failure_model):
        """
        Initializes the Training Service.

        Args:
            production_model: ProductionForecast instance.
            delay_model: DelayPrediction instance.
            performance_analyzer: PerformanceAnalysis instance.
            failure_model: FailurePrediction instance.
        """
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

    # =====================================================================
    # Synthetic Bootstrap Data Generators
    # =====================================================================

    def _generate_sample_production_data(self, n: int = 500) -> pd.DataFrame:
        """
        Generates realistic garment production timeline data for model initial training.

        Simulates:
        - Daily order volume (500 to 5000 pieces)
        - Staff count (30 to 100 operators)
        - Machine count (10 to 30 machines)
        - Output equation: 0.85 * volume + 5 * employees + 20 * machines + seasonal trend + noise

        Args:
            n (int): Number of daily records to generate.

        Returns:
            pd.DataFrame: Synthetic production history.
        """
        np.random.seed(42)
        dates = pd.date_range(start='2023-01-01', periods=n, freq='D')
        data = pd.DataFrame({
            'order_date': dates,
            'employee_count': np.random.randint(30, 100, n),
            'machine_count': np.random.randint(10, 30, n),
            'order_volume': np.random.randint(500, 5000, n),
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
            data['employee_count'] * 5.0 +
            data['machine_count'] * 20.0 +
            trend + noise
        ).clip(300, 5500).astype(int)

        return data

    def _generate_sample_delay_data(self, n: int = 500) -> pd.DataFrame:
        """
        Generates order delivery history with delay probabilities and root causes.

        Simulates:
        - Order complexity (1 to 10 scale)
        - Operator tenure (0.5 to 10 years)
        - Equipment health index (0.3 to 1.0)
        - Material availability (0.4 to 1.0)
        - Workload saturation (20% to 100%)

        Args:
            n (int): Number of order records.

        Returns:
            pd.DataFrame: Synthetic order history with delay labels.
        """
        np.random.seed(43)
        data = pd.DataFrame({
            'order_complexity': np.random.randint(1, 10, n),
            'employee_experience': np.random.uniform(0.5, 10.0, n),
            'machine_health': np.random.uniform(0.3, 1.0, n),
            'material_availability': np.random.uniform(0.4, 1.0, n),
            'workload': np.random.uniform(20.0, 100.0, n),
            'order_quantity': np.random.randint(100, 5000, n),
            'lead_time_days': np.random.randint(5, 45, n),
        })

        delay_prob = (
            0.30 * (data['order_complexity'] / 10.0) +
            0.25 * (1.0 - data['machine_health']) +
            0.20 * (1.0 - data['material_availability']) +
            0.15 * (data['workload'] / 100.0) +
            0.10 * (1.0 - data['employee_experience'] / 10.0)
        )

        data['delayed'] = (delay_prob + np.random.uniform(-0.15, 0.15, n) > 0.35).astype(int)
        data['delay_days'] = data['delayed'] * np.random.randint(1, 15, n)
        return data

    def _generate_sample_machine_data(self, n: int = 300) -> pd.DataFrame:
        """
        Generates machine sensor telemetry and historical breakdown records.

        Simulates:
        - Motor temperature (50°C to 100°C)
        - Vibration acceleration (0.1 to 1.2 RMS)
        - Operating stitch speed (50 to 200 RPM)
        - Power consumption (20 to 100 W)
        - Operating hours since last service (0 to 2000 hrs)

        Args:
            n (int): Number of telemetry samples.

        Returns:
            pd.DataFrame: Synthetic sensor dataset with breakdown indicators.
        """
        np.random.seed(44)
        data = pd.DataFrame({
            'temperature': np.random.uniform(50.0, 100.0, n),
            'vibration': np.random.uniform(0.1, 1.2, n),
            'speed': np.random.uniform(50.0, 200.0, n),
            'power_usage': np.random.uniform(20.0, 100.0, n),
            'hours_since_maintenance': np.random.uniform(0.0, 2000.0, n),
            'age_days': np.random.randint(30, 2000, n),
            'operating_hours': np.random.uniform(100.0, 5000.0, n),
        })

        failure_score = (
            0.20 * (data['temperature'] / 100.0) +
            0.30 * data['vibration'] +
            0.10 * (1.0 - data['speed'] / 200.0) +
            0.15 * (data['power_usage'] / 100.0) +
            0.25 * (1.0 - np.exp(-data['hours_since_maintenance'] / 500.0))
        )

        data['failure'] = (failure_score + np.random.uniform(-0.1, 0.1, n) > 0.50).astype(int)
        return data

    # =====================================================================
    # Individual Model Training Pipelines
    # =====================================================================

    def train_production_model(self, data: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Trains, evaluates, and saves the Production Forecast model."""
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
            logger.error(f"Production forecast training failed: {e}")
            self._training_status['production_forecast']['status'] = 'error'
            self._training_status['production_forecast']['error'] = str(e)
            raise

    def train_delay_model(self, data: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Trains, evaluates, and saves the Order Delay Prediction model."""
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
            logger.error(f"Delay prediction training failed: {e}")
            self._training_status['delay_prediction']['status'] = 'error'
            self._training_status['delay_prediction']['error'] = str(e)
            raise

    def train_failure_model(self, data: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Trains, evaluates, and saves the Machine Failure Prediction model."""
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
            logger.error(f"Failure prediction training failed: {e}")
            self._training_status['failure_prediction']['status'] = 'error'
            self._training_status['failure_prediction']['error'] = str(e)
            raise

    def train_all_models(
        self,
        production_data: Optional[pd.DataFrame] = None,
        delay_data: Optional[pd.DataFrame] = None,
        machine_data: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Trains all 3 machine learning models in sequence with thread locking.

        Args:
            production_data: Optional custom production dataset.
            delay_data: Optional custom order dataset.
            machine_data: Optional custom machine sensor dataset.

        Returns:
            Dict[str, Any]: Combined training metrics for all models.
        """
        logger.info("Initiating full multi-model training pipeline")
        results = {}

        with self._training_lock:
            results['production_forecast'] = self.train_production_model(production_data)
            results['delay_prediction'] = self.train_delay_model(delay_data)
            results['failure_prediction'] = self.train_failure_model(machine_data)

        logger.info("All AI models trained and persisted successfully.")
        return results

    # =====================================================================
    # Persistence & Status Utilities
    # =====================================================================

    def load_models(self) -> Dict[str, bool]:
        """
        Loads all model artifacts from the configured disk directory.

        Returns:
            Dict[str, bool]: Success flags for each model.
        """
        logger.info(f"Loading persisted models from disk: {self._model_dir}")
        results = {
            'production_forecast': self.production_model.load(self._model_dir),
            'delay_prediction': self.delay_model.load(self._model_dir),
            'failure_prediction': self.failure_model.load(self._model_dir),
        }

        loaded_count = sum(1 for v in results.values() if v)
        logger.info(f"Loaded {loaded_count}/3 models from storage.")

        for name, success in results.items():
            if success:
                self._training_status[name]['status'] = 'ready'
                model_obj = getattr(self, name, None)
                if model_obj:
                    self._training_status[name]['last_trained'] = getattr(model_obj, 'last_trained', None)

        return results

    def save_models(self) -> Dict[str, str]:
        """Persists all current in-memory models to disk."""
        logger.info("Saving all active models to disk")
        return {
            'production_forecast': self.production_model.save(self._model_dir),
            'delay_prediction': self.delay_model.save(self._model_dir),
            'failure_prediction': self.failure_model.save(self._model_dir)
        }

    def get_model_status(self) -> Dict[str, Any]:
        """
        Compiles the current operational state, versions, and accuracy metrics
        for all 4 engines.

        Returns:
            Dict[str, Any]: Detailed status report.
        """
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
                    'r2_score': getattr(model, 'r2_score', 0.0),
                    'mae': getattr(model, 'mae', 0.0),
                    'rmse': getattr(model, 'rmse', 0.0),
                    'accuracy': getattr(model, 'accuracy', 0.0),
                    'precision': getattr(model, 'precision', 0.0),
                    'recall': getattr(model, 'recall', 0.0),
                    'f1': getattr(model, 'f1', 0.0),
                    'auc_roc': getattr(model, 'auc_roc', 0.0),
                }
            }

        # Workforce module (statistical)
        status['performance_analysis'] = {
            'model_loaded': True,
            'version': self.performance_analyzer.version,
            'training_status': 'ready',
            'type': 'statistical_rule_engine'
        }

        status['model_dir'] = self._model_dir
        status['models_available'] = sum(
            1 for s in status.values() if isinstance(s, dict) and s.get('model_loaded')
        )

        return status

    # =====================================================================
    # Background Periodic Retraining Daemon
    # =====================================================================

    def schedule_retraining(self, interval_hours: int = 24) -> threading.Thread:
        """
        Starts a background daemon thread that periodically triggers model retraining.

        Args:
            interval_hours (int): Time interval between retraining runs (default: 24h).

        Returns:
            threading.Thread: The started background worker thread.
        """
        def retrain_loop():
            logger.info(f"Background model retraining scheduled every {interval_hours} hours")
            while True:
                try:
                    time.sleep(interval_hours * 3600)
                    logger.info("Executing scheduled periodic model retraining...")
                    self.train_all_models()
                except Exception as e:
                    logger.error(f"Periodic model retraining encountered an error: {e}")

        thread = threading.Thread(target=retrain_loop, daemon=True, name="AI-Model-Retrainer")
        thread.start()
        return thread

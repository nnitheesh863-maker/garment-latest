"""
Machine Failure & Predictive Maintenance Machine Learning Model
==============================================================
Analyzes IoT telemetry and maintenance history from sewing, cutting, and
ironing machinery to predict breakdown probabilities, estimate Time-To-Failure (TTF),
flag critical sensor thresholds, and generate preventive maintenance orders.

Algorithm: Random Forest Classifier (Balanced)
Sensors: Temperature, Vibration, Speed, Power Usage, Maintenance Recency
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

from config import setup_logging

logger = setup_logging(__name__)


class FailurePrediction:
    """
    Predictive maintenance classification model for garment manufacturing machinery.
    Estimates impending failure probabilities and operational Time-To-Failure (TTF).
    """

    # Critical anomaly thresholds for sensor monitoring
    THRESHOLDS = {
        'temperature': 80.0,       # Degrees Celsius
        'vibration': 0.70,          # RMS Vibration index
        'power_usage': 90.0,        # Watts / Current draw index
        'hours_since_maintenance': 500.0  # Operating hours
    }

    def __init__(self, model_dir: Optional[str] = None):
        """
        Initializes the Failure Prediction model instance.

        Args:
            model_dir (Optional[str]): Path to model storage directory.
        """
        self.model: Optional[RandomForestClassifier] = None
        self.feature_names: Optional[List[str]] = None
        self.accuracy: float = 0.0
        self.precision: float = 0.0
        self.recall: float = 0.0
        self.f1: float = 0.0
        self.auc_roc: float = 0.0
        self.version: str = '1.0.0'
        self.last_trained: Optional[str] = None
        self._model_dir: Optional[str] = model_dir

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts and normalizes machine telemetry and wear features.

        Key Features:
        1. `temperature`: Machine motor temperature (°C).
        2. `vibration`: Vibration accelerometer reading.
        3. `speed`: Operating stitches/minute or RPM.
        4. `power_usage`: Real-time electrical power draw.
        5. `hours_since_maintenance`: Accumulated service hours.
        6. `age_days`: Total days since machine commissioning.

        Args:
            df (pd.DataFrame): Raw machine records.

        Returns:
            pd.DataFrame: Cleaned numeric features.
        """
        df = df.copy()
        features = pd.DataFrame(index=df.index)

        features['temperature'] = pd.to_numeric(
            df.get('temperature', 70.0), errors='coerce'
        ).fillna(70.0)

        features['vibration'] = pd.to_numeric(
            df.get('vibration', df.get('vibration_level', 0.5)), errors='coerce'
        ).fillna(0.5)

        features['speed'] = pd.to_numeric(
            df.get('speed', 100.0), errors='coerce'
        ).fillna(100.0)

        features['power_usage'] = pd.to_numeric(
            df.get('power_usage', 50.0), errors='coerce'
        ).fillna(50.0)

        features['hours_since_maintenance'] = pd.to_numeric(
            df.get('hours_since_maintenance', 168.0), errors='coerce'
        ).fillna(168.0)

        features['age_days'] = pd.to_numeric(
            df.get('age_days', df.get('age', df.get('installation_age_days', 365))),
            errors='coerce'
        ).fillna(365)

        # Auxiliary sensor or maintenance metrics
        auxiliary = [
            'operating_hours', 'maintenance_count', 'maintenance_frequency',
            'load_percentage', 'humidity', 'error_count'
        ]
        for col in auxiliary:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(self, machine_history: Union[pd.DataFrame, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Trains the machine breakdown classifier using historical sensor telemetry.

        Args:
            machine_history: Telemetry dataset with failure labels.

        Returns:
            Dict[str, Any]: Model accuracy, precision, recall, F1, and AUC-ROC.
        """
        df = pd.DataFrame(machine_history) if not isinstance(machine_history, pd.DataFrame) else machine_history.copy()
        logger.info(f"Training FailurePrediction on {len(df)} machine records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        # Target label: 1 = Failure/Maintenance Required, 0 = Healthy
        if 'failure' in df.columns:
            target = pd.to_numeric(df['failure'], errors='coerce').fillna(0).astype(int)
        elif 'failed' in df.columns:
            target = pd.to_numeric(df['failed'], errors='coerce').fillna(0).astype(int)
        elif 'maintenance_required' in df.columns:
            target = pd.to_numeric(df['maintenance_required'], errors='coerce').fillna(0).astype(int)
        else:
            np.random.seed(42)
            # Physical failure probability model based on known degradation curves
            failure_score = (
                0.20 * (features['temperature'] / 100.0) +
                0.30 * features['vibration'] +
                0.10 * (1.0 - features['speed'] / 200.0) +
                0.15 * (features['power_usage'] / 100.0) +
                0.25 * (1.0 - np.exp(-features['hours_since_maintenance'] / 500.0))
            )
            target = (failure_score + np.random.uniform(-0.1, 0.1, len(features)) > 0.50).astype(int)
            logger.warning("No explicit failure label found; generated physics-based failure target.")

        stratify_target = target if len(np.unique(target)) > 1 else None
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42, stratify=stratify_target
        )

        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1] if self.model.classes_.shape[0] > 1 else y_pred

        self.accuracy = float(accuracy_score(y_test, y_pred))
        self.precision = float(precision_score(y_test, y_pred, zero_division=0))
        self.recall = float(recall_score(y_test, y_pred, zero_division=0))
        self.f1 = float(f1_score(y_test, y_pred, zero_division=0))
        try:
            self.auc_roc = float(roc_auc_score(y_test, y_prob))
        except Exception:
            self.auc_roc = 0.5

        feature_importance = dict(zip(self.feature_names, [float(x) for x in self.model.feature_importances_]))
        self.last_trained = datetime.now().isoformat()

        logger.info(
            f"Machine Failure Training Complete -> Acc: {self.accuracy:.4f}, "
            f"Prec: {self.precision:.4f}, Recall: {self.recall:.4f}, "
            f"F1: {self.f1:.4f}, AUC-ROC: {self.auc_roc:.4f}"
        )

        return {
            'accuracy': round(self.accuracy, 4),
            'precision': round(self.precision, 4),
            'recall': round(self.recall, 4),
            'f1': round(self.f1, 4),
            'auc_roc': round(self.auc_roc, 4),
            'feature_importance': feature_importance
        }

    def predict(self, machine_features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Evaluates machine telemetry to produce:
        - Failure Probability (0-100%)
        - Risk Level ('Critical', 'High', 'Medium', 'Low')
        - Estimated Time-To-Failure (TTF) in operating hours & days
        - Triggered sensor threshold violations
        - Prescriptive maintenance instructions

        Args:
            machine_features: Sensor inputs for one or multiple machines.

        Returns:
            Dict or List of Dicts with diagnostic maintenance data.
        """
        if self.model is None:
            raise RuntimeError("FailurePrediction model is not trained or loaded. Call train() or load() first.")

        df = pd.DataFrame([machine_features]) if isinstance(machine_features, dict) else pd.DataFrame(machine_features)
        processed = self._extract_features(df)

        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        if len(self.model.classes_) > 1:
            probabilities = self.model.predict_proba(processed)[:, 1] * 100.0
        else:
            probabilities = self.model.predict(processed) * 100.0

        results = []
        for i in range(len(processed)):
            prob = float(probabilities[i])
            row = processed.iloc[i]

            temp = float(row.get('temperature', 70.0))
            vib = float(row.get('vibration', 0.5))
            hrs = float(row.get('hours_since_maintenance', 168.0))

            # Physics-based Time-To-Failure estimation (in hours)
            # Baseline: 8760 hours (1 year) scaled down by failure probability, vibration, and temperature
            ttf_hours = 8760.0 * max(0.01, (1.0 - prob / 100.0)) * (1.0 / (1.0 + vib)) * (100.0 / (temp + 1.0))
            ttf_hours = max(1.0, float(ttf_hours))
            ttf_days = ttf_hours / 24.0

            # Determine Risk Level Category
            if prob > 70.0:
                risk_level = 'Critical'
            elif prob > 40.0:
                risk_level = 'High'
            elif prob > 20.0:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'

            # Prescriptive maintenance action generation
            maintenance_actions = []
            if prob > 70.0:
                maintenance_actions.append('CRITICAL: Halt machine and dispatch mechanic for immediate inspection')
                maintenance_actions.append('Inspect and replace worn drive belts, bearings, or needle bars')
            elif prob > 40.0:
                maintenance_actions.append('Schedule preventive maintenance window within the next 48 hours')
                maintenance_actions.append('Check oil levels, clean lint buildup, and calibrate motor tension')
            else:
                maintenance_actions.append('Continue standard operational shift monitoring')
                maintenance_actions.append('Log telemetry into weekly equipment maintenance ledger')

            # Specific sensor alerts
            if hrs > self.THRESHOLDS['hours_since_maintenance']:
                maintenance_actions.append(f'Overdue maintenance: Machine has logged {hrs:.0f} hours since last service')
            if temp > self.THRESHOLDS['temperature']:
                maintenance_actions.append(f'Thermal alert: Motor temperature ({temp:.1f}°C) exceeds safety threshold')
            if vib > self.THRESHOLDS['vibration']:
                maintenance_actions.append(f'Vibration alert: Sensor index ({vib:.2f}) indicates shaft/needle misalignment')

            critical_indicators = self._get_critical_indicators(row)

            results.append({
                'failure_probability': round(prob, 2),
                'risk_level': risk_level,
                'estimated_ttf_days': round(ttf_days, 1),
                'estimated_ttf_hours': round(ttf_hours, 0),
                'required_maintenance': maintenance_actions[:5],
                'critical_indicators': critical_indicators
            })

        return results[0] if len(results) == 1 and isinstance(machine_features, dict) else results

    def _get_critical_indicators(self, row: pd.Series) -> List[Dict[str, Any]]:
        """
        Identifies any telemetry parameters exceeding factory safety tolerances.

        Args:
            row (pd.Series): Machine sensor row.

        Returns:
            List[Dict[str, Any]]: List of exceeded parameters with their values and thresholds.
        """
        indicators = []
        if float(row.get('temperature', 70)) > self.THRESHOLDS['temperature']:
            indicators.append({
                'parameter': 'temperature',
                'value': float(row['temperature']),
                'threshold': self.THRESHOLDS['temperature'],
                'unit': '°C'
            })
        if float(row.get('vibration', 0.5)) > self.THRESHOLDS['vibration']:
            indicators.append({
                'parameter': 'vibration',
                'value': float(row['vibration']),
                'threshold': self.THRESHOLDS['vibration'],
                'unit': 'index'
            })
        if float(row.get('power_usage', 50)) > self.THRESHOLDS['power_usage']:
            indicators.append({
                'parameter': 'power_usage',
                'value': float(row['power_usage']),
                'threshold': self.THRESHOLDS['power_usage'],
                'unit': 'W'
            })
        if float(row.get('hours_since_maintenance', 168)) > self.THRESHOLDS['hours_since_maintenance']:
            indicators.append({
                'parameter': 'hours_since_maintenance',
                'value': float(row['hours_since_maintenance']),
                'threshold': self.THRESHOLDS['hours_since_maintenance'],
                'unit': 'hrs'
            })

        if not indicators:
            indicators.append({'parameter': 'status', 'value': 'normal', 'threshold': 'normal', 'unit': 'none'})

        return indicators

    def save(self, model_dir: Optional[str] = None) -> str:
        """
        Persists trained failure prediction model artifact to disk.

        Args:
            model_dir (Optional[str]): Destination folder path.

        Returns:
            str: Path to saved .joblib file.
        """
        path = model_dir or self._model_dir
        if not path:
            raise ValueError("No model directory specified.")

        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'failure_prediction.joblib')

        payload = {
            'model': self.model,
            'feature_names': self.feature_names,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1': self.f1,
            'auc_roc': self.auc_roc,
            'version': self.version,
            'last_trained': self.last_trained
        }
        joblib.dump(payload, filepath)
        logger.info(f"Failure prediction model saved to: {filepath}")
        return filepath

    def load(self, model_dir: Optional[str] = None) -> bool:
        """
        Loads pre-trained failure prediction model from disk.

        Args:
            model_dir (Optional[str]): Model directory path.

        Returns:
            bool: True if successfully loaded, False otherwise.
        """
        path = model_dir or self._model_dir
        if not path:
            return False

        filepath = os.path.join(path, 'failure_prediction.joblib')
        if not os.path.exists(filepath):
            logger.warning(f"No saved FailurePrediction model found at: {filepath}")
            return False

        try:
            payload = joblib.load(filepath)
            self.model = payload['model']
            self.feature_names = payload.get('feature_names')
            self.accuracy = payload.get('accuracy', 0.0)
            self.precision = payload.get('precision', 0.0)
            self.recall = payload.get('recall', 0.0)
            self.f1 = payload.get('f1', 0.0)
            self.auc_roc = payload.get('auc_roc', 0.0)
            self.version = payload.get('version', '1.0.0')
            self.last_trained = payload.get('last_trained')
            logger.info(f"Failure prediction model loaded from: {filepath} (v{self.version})")
            return True
        except Exception as e:
            logger.error(f"Failed loading failure prediction model: {e}")
            return False

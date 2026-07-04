import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from config import setup_logging

logger = setup_logging(__name__)


class FailurePrediction:
    def __init__(self, model_dir=None):
        self.model = None
        self.feature_names = None
        self.accuracy = 0.0
        self.precision = 0.0
        self.recall = 0.0
        self.f1 = 0.0
        self.auc_roc = 0.0
        self.version = '1.0.0'
        self.last_trained = None
        self._model_dir = model_dir

    def _extract_features(self, df):
        df = df.copy()
        features = pd.DataFrame()

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
            df.get('hours_since_maintenance', df.get('hours_since_maintenance', 168.0)),
            errors='coerce'
        ).fillna(168.0)

        features['age_days'] = pd.to_numeric(
            df.get('age_days', df.get('age', df.get('installation_age_days', 365))),
            errors='coerce'
        ).fillna(365)

        extra = [
            'operating_hours', 'maintenance_count', 'maintenance_frequency',
            'load_percentage', 'humidity', 'error_count'
        ]
        for col in extra:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(self, machine_history):
        df = pd.DataFrame(machine_history) if not isinstance(machine_history, pd.DataFrame) else machine_history.copy()
        logger.info(f"Training FailurePrediction on {df.shape[0]} records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        if 'failure' in df.columns:
            target = pd.to_numeric(df['failure'], errors='coerce').fillna(0).astype(int)
        elif 'failed' in df.columns:
            target = pd.to_numeric(df['failed'], errors='coerce').fillna(0).astype(int)
        elif 'maintenance_required' in df.columns:
            target = pd.to_numeric(df['maintenance_required'], errors='coerce').fillna(0).astype(int)
        else:
            np.random.seed(42)
            failure_score = (
                0.2 * (features['temperature'] / 100) +
                0.3 * features['vibration'] +
                0.1 * (1 - features['speed'] / 200) +
                0.2 * (features['power_usage'] / 100) +
                0.2 * (1 - np.exp(-features['hours_since_maintenance'] / 720))
            )
            target = (failure_score + np.random.uniform(-0.1, 0.1, len(features)) > 0.5).astype(int)
            logger.warning("No failure column found; generating synthetic target")

        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42, stratify=target
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
        y_prob = self.model.predict_proba(X_test)[:, 1]

        self.accuracy = accuracy_score(y_test, y_pred)
        self.precision = precision_score(y_test, y_pred, zero_division=0)
        self.recall = recall_score(y_test, y_pred, zero_division=0)
        self.f1 = f1_score(y_test, y_pred, zero_division=0)
        self.auc_roc = roc_auc_score(y_test, y_prob)

        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        logger.info(f"Training complete - Acc: {self.accuracy:.4f}, Prec: {self.precision:.4f}, "
                     f"Recall: {self.recall:.4f}, F1: {self.f1:.4f}, AUC: {self.auc_roc:.4f}")
        logger.info(f"Top indicators: {dict(sorted(feature_importance.items(), key=lambda x: -x[1])[:3])}")

        from datetime import datetime
        self.last_trained = datetime.now().isoformat()
        return {
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1': self.f1,
            'auc_roc': self.auc_roc,
            'feature_importance': feature_importance
        }

    def predict(self, machine_features):
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        df = pd.DataFrame([machine_features]) if isinstance(machine_features, dict) else pd.DataFrame(machine_features)
        processed = self._extract_features(df)

        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        proba = self.model.predict_proba(processed)[:, 1]
        failure_probabilities = proba * 100

        results = []
        for i in range(len(processed)):
            prob = failure_probabilities[i]

            temp = float(processed.iloc[i].get('temperature', 70))
            vib = float(processed.iloc[i].get('vibration', 0.5))
            hrs = float(processed.iloc[i].get('hours_since_maintenance', 168))
            age = float(processed.iloc[i].get('age_days', 365))

            ttf_hours = 8760 * (1 - prob / 100) * (1 / (1 + vib)) * (100 / (temp + 1))
            ttf_hours = max(1, ttf_hours)
            ttf_days = ttf_hours / 24

            maintenance = []
            if prob > 70:
                maintenance.append('Immediate: Stop machine and perform full inspection')
                maintenance.append('Replace worn components (bearings, belts, filters)')
            elif prob > 40:
                maintenance.append('Schedule preventive maintenance within 48 hours')
                maintenance.append('Check lubrication levels and tighten connections')
            else:
                maintenance.append('Continue routine scheduled maintenance')
                maintenance.append('Monitor temperature and vibration trends weekly')

            if hrs > 500:
                maintenance.append('Service overdue - prioritize maintenance scheduling')
            if temp > 85:
                maintenance.append('Check cooling system - temperature above threshold')
            if vib > 0.8:
                maintenance.append('Investigate vibration source - possible misalignment')

            results.append({
                'failure_probability': round(float(prob), 2),
                'risk_level': 'Critical' if prob > 70 else ('High' if prob > 40 else ('Medium' if prob > 20 else 'Low')),
                'estimated_ttf_days': round(float(ttf_days), 1),
                'estimated_ttf_hours': round(float(ttf_hours), 0),
                'required_maintenance': maintenance[:5],
                'critical_indicators': self._get_critical_indicators(processed.iloc[i])
            })

        return results[0] if len(results) == 1 else results

    def _get_critical_indicators(self, row):
        indicators = []
        if row.get('temperature', 70) > 80:
            indicators.append({'parameter': 'temperature', 'value': float(row['temperature']), 'threshold': 80})
        if row.get('vibration', 0.5) > 0.7:
            indicators.append({'parameter': 'vibration', 'value': float(row['vibration']), 'threshold': 0.7})
        if row.get('power_usage', 50) > 90:
            indicators.append({'parameter': 'power_usage', 'value': float(row['power_usage']), 'threshold': 90})
        if row.get('hours_since_maintenance', 168) > 500:
            indicators.append({'parameter': 'hours_since_maintenance', 'value': float(row['hours_since_maintenance']), 'threshold': 500})
        if not indicators:
            indicators.append({'parameter': 'status', 'value': 'normal', 'threshold': 'normal'})
        return indicators

    def save(self, model_dir=None):
        path = model_dir or self._model_dir
        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'failure_prediction.joblib')
        data = {
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
        joblib.dump(data, filepath)
        logger.info(f"Model saved to {filepath}")
        return filepath

    def load(self, model_dir=None):
        path = model_dir or self._model_dir
        filepath = os.path.join(path, 'failure_prediction.joblib')
        if not os.path.exists(filepath):
            logger.warning(f"No saved model found at {filepath}")
            return False
        data = joblib.load(filepath)
        self.model = data['model']
        self.feature_names = data.get('feature_names')
        self.accuracy = data.get('accuracy', 0.0)
        self.precision = data.get('precision', 0.0)
        self.recall = data.get('recall', 0.0)
        self.f1 = data.get('f1', 0.0)
        self.auc_roc = data.get('auc_roc', 0.0)
        self.version = data.get('version', '1.0.0')
        self.last_trained = data.get('last_trained')
        logger.info(f"Model loaded from {filepath} (version {self.version})")
        return True

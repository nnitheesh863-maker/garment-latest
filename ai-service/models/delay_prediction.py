import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from config import setup_logging

logger = setup_logging(__name__)


class DelayPrediction:
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

        features['order_complexity'] = pd.to_numeric(
            df.get('order_complexity', df.get('complexity', 5)), errors='coerce'
        ).fillna(5)

        features['employee_experience'] = pd.to_numeric(
            df.get('employee_experience', df.get('experience_years', df.get('years_of_experience', 3))),
            errors='coerce'
        ).fillna(3)

        features['machine_health'] = pd.to_numeric(
            df.get('machine_health', df.get('health_score', df.get('health', 0.8))),
            errors='coerce'
        ).fillna(0.8)

        features['material_availability'] = pd.to_numeric(
            df.get('material_availability', df.get('material_score', 0.9)),
            errors='coerce'
        ).fillna(0.9)

        features['workload'] = pd.to_numeric(
            df.get('workload', df.get('workload_percentage', 50)),
            errors='coerce'
        ).fillna(50)

        extra = [
            'order_quantity', 'lead_time_days', 'day_of_week', 'month',
            'order_priority_score', 'capacity_utilization', 'employee_count'
        ]
        for col in extra:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(self, order_history):
        df = pd.DataFrame(order_history) if not isinstance(order_history, pd.DataFrame) else order_history.copy()
        logger.info(f"Training DelayPrediction on {df.shape[0]} records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        if 'delayed' in df.columns:
            target = pd.to_numeric(df['delayed'], errors='coerce').fillna(0).astype(int)
        elif 'delay_days' in df.columns:
            target = (pd.to_numeric(df['delay_days'], errors='coerce').fillna(0) > 0).astype(int)
        else:
            np.random.seed(42)
            delay_prob = 0.3 + 0.3 * (1 - features.get('machine_health', 0.8)) + \
                         0.2 * (features.get('order_complexity', 5) / 10) + \
                         0.2 * (1 - features.get('material_availability', 0.9))
            target = (np.random.random(len(features)) < delay_prob).astype(int)
            logger.warning("No 'delayed' column found; generating synthetic target")

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
        logger.info(f"Top risk factors: {dict(sorted(feature_importance.items(), key=lambda x: -x[1])[:3])}")

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

    def predict(self, order_features):
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        df = pd.DataFrame([order_features]) if isinstance(order_features, dict) else pd.DataFrame(order_features)
        processed = self._extract_features(df)

        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        proba = self.model.predict_proba(processed)[:, 1]
        delay_probabilities = proba * 100

        results = []
        for i in range(len(processed)):
            prob = delay_probabilities[i]
            base_delay = 0.5 + 2.0 * (prob / 100)
            complexity_factor = float(processed.iloc[i].get('order_complexity', 5)) / 10.0
            health_factor = 1.0 - float(processed.iloc[i].get('machine_health', 0.8))
            estimated_delay = base_delay + complexity_factor * 3 + health_factor * 5

            risk_factors = []
            if processed.iloc[i].get('order_complexity', 5) > 7:
                risk_factors.append('High order complexity')
            if processed.iloc[i].get('machine_health', 0.8) < 0.6:
                risk_factors.append('Poor machine health')
            if processed.iloc[i].get('material_availability', 0.9) < 0.7:
                risk_factors.append('Low material availability')
            if processed.iloc[i].get('workload', 50) > 80:
                risk_factors.append('Excessive workload')
            if processed.iloc[i].get('employee_experience', 3) < 2:
                risk_factors.append('Inexperienced workforce')

            if prob < 30:
                severity = 'Low'
            elif prob < 60:
                severity = 'Medium'
            else:
                severity = 'High'

            recommended_actions = self._generate_actions(risk_factors, prob)

            results.append({
                'delay_probability': round(float(prob), 2),
                'delay_risk_severity': severity,
                'estimated_delay_days': round(float(estimated_delay), 1),
                'risk_factors': risk_factors,
                'recommended_actions': recommended_actions
            })

        return results[0] if len(results) == 1 else results

    def _generate_actions(self, risk_factors, probability):
        actions = []
        for factor in risk_factors:
            if 'complexity' in factor.lower():
                actions.append('Break down order into simpler sub-tasks')
                actions.append('Assign senior employees to complex stages')
            elif 'machine' in factor.lower():
                actions.append('Schedule preventive maintenance immediately')
                actions.append('Prepare backup machines for critical operations')
            elif 'material' in factor.lower():
                actions.append('Expedite material procurement')
                actions.append('Identify alternative material suppliers')
            elif 'workload' in factor.lower():
                actions.append('Redistribute workload across production lines')
                actions.append('Consider overtime or temporary staff')
            elif 'inexperienced' in factor.lower():
                actions.append('Provide additional training before order start')
                actions.append('Pair inexperienced workers with mentors')

        if probability > 70:
            actions.append('Escalate to production manager for review')
            actions.append('Develop contingency production plan')

        if not actions:
            actions.append('Continue regular monitoring')

        return actions[:5]

    def save(self, model_dir=None):
        path = model_dir or self._model_dir
        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'delay_prediction.joblib')
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
        filepath = os.path.join(path, 'delay_prediction.joblib')
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

"""
Delay Prediction Model
Predicts shipment and production delays based on historical cycle times and operational factors.
"""
"""
Order Delay Prediction Machine Learning Model
=============================================
Predicts the risk and probability of production order delivery delays,
identifies the key contributing operational bottlenecks, and generates
actionable mitigation strategies for production managers.

Algorithm: Random Forest Classifier (Class Weighted)
Output: Delay Probability, Severity (Low/Medium/High), Root Causes, Mitigation Actions
"""

import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

# Ensure parent directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

try:
    from config import setup_logging
except ImportError:
    import logging
    def setup_logging(name='ai-service'):
        return logging.getLogger(name)

logger = setup_logging(__name__)


class DelayPrediction:
    """
    Random Forest Classification model to identify high-risk garment production orders
    likely to experience shipment or manufacturing delays.
    """

    def __init__(self, model_dir: Optional[str] = None):
        """
        Initializes the Delay Prediction model instance.

        Args:
            model_dir (Optional[str]): Directory path where model artifacts are persisted.
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
        Extracts operational delay risk features from order records.

        Key Features:
        1. `order_complexity`: Scale 1-10 indicating intricate cuts/embroidery.
        2. `employee_experience`: Average line worker tenure in years.
        3. `machine_health`: Health ratio (0.0 to 1.0) of allocated line equipment.
        4. `material_availability`: Fabric & trim supply readiness score (0.0 to 1.0).
        5. `workload`: Current plant capacity utilization percentage (0-100%).

        Args:
            df (pd.DataFrame): Order inputs.

        Returns:
            pd.DataFrame: Numeric feature matrix.
        """
        df = df.copy()
        features = pd.DataFrame(index=df.index)

        features['order_complexity'] = pd.to_numeric(
            df.get('order_complexity', df.get('complexity', 5)), errors='coerce'
        ).fillna(5)

        features['employee_experience'] = pd.to_numeric(
            df.get('employee_experience', df.get('experience_years', df.get('years_of_experience', 3.0))),
            errors='coerce'
        ).fillna(3.0)

        features['machine_health'] = pd.to_numeric(
            df.get('machine_health', df.get('health_score', df.get('health', 0.8))),
            errors='coerce'
        ).fillna(0.8)

        features['material_availability'] = pd.to_numeric(
            df.get('material_availability', df.get('material_score', 0.9)),
            errors='coerce'
        ).fillna(0.9)

        features['workload'] = pd.to_numeric(
            df.get('workload', df.get('workload_percentage', 50.0)),
            errors='coerce'
        ).fillna(50.0)

        # Auxiliary fields
        auxiliary = [
            'order_quantity', 'lead_time_days', 'day_of_week', 'month',
            'order_priority_score', 'capacity_utilization', 'employee_count'
        ]
        for col in auxiliary:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(self, order_history: Union[pd.DataFrame, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Trains the Random Forest classification model with class balancing.

        Args:
            order_history: Dataset containing historical order execution records.

        Returns:
            Dict[str, Any]: Evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC) and feature importance.
        """
        df = pd.DataFrame(order_history) if not isinstance(order_history, pd.DataFrame) else order_history.copy()
        logger.info(f"Training DelayPrediction on {len(df)} records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        # Determine target binary label: 1 = Delayed, 0 = On-Time
        if 'delayed' in df.columns:
            target = pd.to_numeric(df['delayed'], errors='coerce').fillna(0).astype(int)
        elif 'delay_days' in df.columns:
            target = (pd.to_numeric(df['delay_days'], errors='coerce').fillna(0) > 0).astype(int)
        else:
            np.random.seed(42)
            delay_prob = (
                0.3 +
                0.3 * (1 - features.get('machine_health', 0.8)) +
                0.2 * (features.get('order_complexity', 5) / 10.0) +
                0.2 * (1 - features.get('material_availability', 0.9))
            )
            target = (np.random.random(len(features)) < delay_prob).astype(int)
            logger.warning("No explicit 'delayed' column found in training data; generated heuristic target.")

        # Ensure balanced representation
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

        # Compute evaluation metrics
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
            f"Delay Prediction Training Complete -> Acc: {self.accuracy:.4f}, "
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

    def predict(self, order_features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Calculates delay probability, estimated delay days, root cause risk factors,
        and targeted mitigation actions.

        Risk Severity Tiers:
        - Low: Probability < 30%
        - Medium: Probability 30% - 60%
        - High: Probability > 60%

        Args:
            order_features: Single order dictionary, list of orders, or DataFrame.

        Returns:
            Dict or List of Dicts with structured delay insights.
        """
        if self.model is None:
            raise RuntimeError("DelayPrediction model is not trained or loaded. Call train() or load() first.")

        df = pd.DataFrame([order_features]) if isinstance(order_features, dict) else pd.DataFrame(order_features)
        processed = self._extract_features(df)

        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        # Calculate class probabilities
        if len(self.model.classes_) > 1:
            probabilities = self.model.predict_proba(processed)[:, 1] * 100.0
        else:
            probabilities = self.model.predict(processed) * 100.0

        results = []
        for i in range(len(processed)):
            prob = float(probabilities[i])
            row = processed.iloc[i]

            # Estimate delay duration in days based on severity factors
            base_delay = 0.5 + 2.0 * (prob / 100.0)
            complexity_factor = float(row.get('order_complexity', 5)) / 10.0
            health_factor = 1.0 - float(row.get('machine_health', 0.8))
            estimated_delay_days = base_delay + complexity_factor * 3.0 + health_factor * 5.0

            # Identify specific contributing risk factors
            risk_factors = []
            if row.get('order_complexity', 5) > 7:
                risk_factors.append('High order complexity (intricate styling/embroidery)')
            if row.get('machine_health', 0.8) < 0.6:
                risk_factors.append('Degraded sewing machine health on assigned line')
            if row.get('material_availability', 0.9) < 0.7:
                risk_factors.append('Low raw material / fabric availability')
            if row.get('workload', 50) > 80:
                risk_factors.append('High factory floor workload & capacity saturation')
            if row.get('employee_experience', 3) < 2:
                risk_factors.append('Inexperienced operator assigned to complex stage')

            # Determine severity level
            if prob < 30.0:
                severity = 'Low'
            elif prob < 60.0:
                severity = 'Medium'
            else:
                severity = 'High'

            recommended_actions = self._generate_actions(risk_factors, prob)

            results.append({
                'delay_probability': round(prob, 2),
                'delay_risk_severity': severity,
                'estimated_delay_days': round(float(estimated_delay_days), 1),
                'risk_factors': risk_factors,
                'recommended_actions': recommended_actions
            })

        return results[0] if len(results) == 1 and isinstance(order_features, dict) else results

    def _generate_actions(self, risk_factors: List[str], probability: float) -> List[str]:
        """
        Translates identified risk factors into actionable operational recommendations.

        Args:
            risk_factors: List of identified root cause strings.
            probability: Predicted delay probability (0-100%).

        Returns:
            List[str]: Up to 5 prioritized mitigation actions.
        """
        actions = []
        for factor in risk_factors:
            f_lower = factor.lower()
            if 'complexity' in f_lower:
                actions.append('Decompose batch into sub-assembly units with specialized line supervisors')
                actions.append('Allocate senior garment technicians to critical stitch stages')
            elif 'machine' in f_lower:
                actions.append('Trigger preventive maintenance ticket for line machines immediately')
                actions.append('Stage backup sewing machines to prevent line stalling')
            elif 'material' in f_lower:
                actions.append('Expedite fabric/trim procurement from secondary verified suppliers')
                actions.append('Verify batch dye lot consistency before cutting')
            elif 'workload' in f_lower:
                actions.append('Rebalance order quotas across underutilized parallel assembly lines')
                actions.append('Authorize optional overtime shift to recover schedule buffer')
            elif 'inexperienced' in f_lower:
                actions.append('Pair junior stitchers with experienced mentor operators')
                actions.append('Conduct a 30-minute pre-production quality and technique briefing')

        if probability > 70.0:
            actions.insert(0, 'Urgent: Escalate order timeline to Plant Production Manager')

        if not actions:
            actions.append('Order is on track; continue standard hourly line monitoring')

        return actions[:5]

    def save(self, model_dir: Optional[str] = None) -> str:
        """
        Persists the trained model artifact and training metrics to disk.

        Args:
            model_dir (Optional[str]): Storage folder path.

        Returns:
            str: Path to saved .joblib file.
        """
        path = model_dir or self._model_dir
        if not path:
            raise ValueError("No model directory specified.")

        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'delay_prediction.joblib')

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
        logger.info(f"Delay prediction model saved to: {filepath}")
        return filepath

    def load(self, model_dir: Optional[str] = None) -> bool:
        """
        Loads pre-trained delay prediction model from disk.

        Args:
            model_dir (Optional[str]): Storage folder path.

        Returns:
            bool: True if loaded successfully, False otherwise.
        """
        path = model_dir or self._model_dir
        if not path:
            return False

        filepath = os.path.join(path, 'delay_prediction.joblib')
        if not os.path.exists(filepath):
            logger.warning(f"No saved DelayPrediction model found at: {filepath}")
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
            logger.info(f"Delay prediction model loaded from: {filepath} (v{self.version})")
            return True
        except Exception as e:
            logger.error(f"Failed loading delay prediction model: {e}")
            return False

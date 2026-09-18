"""
Production Forecast Machine Learning Model
==========================================
Predicts expected garment production output based on workforce capacity,
active machines, scheduled order volume, and calendar factors.

Algorithm: Random Forest Regressor
Ensemble Uncertainty: Tree variance estimation for 95% Confidence Intervals
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from config import setup_logging

logger = setup_logging(__name__)


class ProductionForecast:
    """
    Random Forest Regression model for forecasting garment factory production quantities.
    Includes uncertainty quantification via decision tree ensemble variance.
    """

    def __init__(self, model_dir: Optional[str] = None):
        """
        Initializes the Production Forecast model container.

        Args:
            model_dir (Optional[str]): Directory path where the trained model is stored.
        """
        self.model: Optional[RandomForestRegressor] = None
        self.feature_names: Optional[List[str]] = None
        self.r2_score: float = 0.0
        self.mae: float = 0.0
        self.rmse: float = 0.0
        self.version: str = '1.0.0'
        self.last_trained: Optional[str] = None
        self._model_dir: Optional[str] = model_dir

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts and aligns numeric feature matrices from input order and resource data.

        Features extracted:
        1. `day_of_week`, `month`: Seasonal and weekly production shifts.
        2. `employee_count`: Total active line workers.
        3. `machine_count`: Total active sewing & finishing machines.
        4. `order_volume`: Planned batch quantity.
        5. Extra features: `lead_time_days`, `order_priority_score`, `capacity_utilization`, `is_weekend`.

        Args:
            df (pd.DataFrame): Raw or preprocessed input records.

        Returns:
            pd.DataFrame: Clean numeric feature DataFrame ready for the model.
        """
        df = df.copy()

        # Parse date if available
        if 'order_date' in df.columns:
            df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')
            df['day_of_week'] = df['order_date'].dt.dayofweek.fillna(0)
            df['month'] = df['order_date'].dt.month.fillna(1)

        features = pd.DataFrame(index=df.index)
        features['day_of_week'] = pd.to_numeric(df.get('day_of_week', 0), errors='coerce').fillna(0)
        features['month'] = pd.to_numeric(df.get('month', 1), errors='coerce').fillna(1)
        features['employee_count'] = pd.to_numeric(df.get('employee_count', 50), errors='coerce').fillna(50)
        features['machine_count'] = pd.to_numeric(df.get('machine_count', 20), errors='coerce').fillna(20)
        features['order_volume'] = pd.to_numeric(
            df.get('order_volume', df.get('order_quantity', 1000)), errors='coerce'
        ).fillna(1000)

        # Optional auxiliary engineered features
        auxiliary_features = [
            'lead_time_days', 'order_priority_score', 'capacity_utilization',
            'is_weekend', 'quarter', 'day_of_month'
        ]
        for col in auxiliary_features:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(
        self,
        historical_data: Union[pd.DataFrame, List[Dict[str, Any]]],
        target_column: str = 'actual_quantity'
    ) -> Dict[str, Any]:
        """
        Trains the Random Forest regression model on historical production records.

        Args:
            historical_data: Training dataset (DataFrame or list of records).
            target_column (str): Name of target column (default: 'actual_quantity').

        Returns:
            Dict[str, Any]: Evaluation metrics (R2, MAE, RMSE) and feature importance rankings.
        """
        df = pd.DataFrame(historical_data) if not isinstance(historical_data, pd.DataFrame) else historical_data.copy()
        logger.info(f"Training ProductionForecast on {len(df)} records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        if target_column in df.columns:
            target = pd.to_numeric(df[target_column], errors='coerce').fillna(0)
        else:
            target = pd.to_numeric(df.get('order_quantity', 1000), errors='coerce').fillna(1000)

        # 80/20 Train-Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )

        # Train Random Forest Regressor
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)

        # Evaluate performance on test set
        y_pred = self.model.predict(X_test)
        self.r2_score = float(r2_score(y_test, y_pred))
        self.mae = float(mean_absolute_error(y_test, y_pred))
        self.rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        feature_importance = dict(zip(self.feature_names, [float(x) for x in self.model.feature_importances_]))
        self.last_trained = datetime.now().isoformat()

        logger.info(
            f"Production Forecast Training Complete -> R2: {self.r2_score:.4f}, "
            f"MAE: {self.mae:.2f}, RMSE: {self.rmse:.2f}"
        )

        return {
            'r2_score': round(self.r2_score, 4),
            'mae': round(self.mae, 2),
            'rmse': round(self.rmse, 2),
            'feature_importance': feature_importance
        }

    def predict(self, features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Generates production quantity forecast and 95% confidence intervals.

        Confidence intervals are calculated using the standard error across all 200 trees:
            Lower Bound = max(0, prediction - 1.96 * std_dev)
            Upper Bound = prediction + 1.96 * std_dev

        Args:
            features: Single dictionary of inputs, list of inputs, or DataFrame.

        Returns:
            Dict or List of Dicts containing:
            - `predicted_quantity`: Expected output pieces.
            - `confidence_interval`: Lower and upper bounds.
            - `trend_direction`: 'upward' | 'stable' | 'downward'
            - `confidence_score`: 0.0 to 1.0 reliability metric.
        """
        if self.model is None:
            raise RuntimeError("ProductionForecast model is not trained or loaded. Call train() or load() first.")

        df = pd.DataFrame([features]) if isinstance(features, dict) else pd.DataFrame(features)
        processed = self._extract_features(df)

        # Align column names with training schema
        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        # 1. Main point prediction
        predictions = self.model.predict(processed)

        # 2. Individual decision tree predictions to estimate uncertainty (standard deviation)
        tree_preds = np.array([
            tree.predict(processed.values) for tree in self.model.estimators_
        ])
        std_dev = np.std(tree_preds, axis=0)

        results = []
        for i, pred in enumerate(predictions):
            ci_lower = max(0.0, float(pred - 1.96 * std_dev[i]))
            ci_upper = float(pred + 1.96 * std_dev[i])

            # Trend heuristic based on variation relative to mean
            rel_variance = std_dev[i] / (pred + 1e-8)
            if rel_variance > 0.15:
                trend = 'downward' if ci_lower < pred * 0.8 else 'upward'
            else:
                trend = 'stable'

            # Confidence score between 0.0 and 1.0
            confidence = max(0.0, min(1.0, 1.0 - (std_dev[i] / (pred + 1e-8))))

            results.append({
                'predicted_quantity': round(float(pred), 2),
                'confidence_interval': {
                    'lower': round(ci_lower, 2),
                    'upper': round(ci_upper, 2)
                },
                'trend_direction': trend,
                'confidence_score': round(float(confidence), 4)
            })

        return results[0] if len(results) == 1 and isinstance(features, dict) else results

    def save(self, model_dir: Optional[str] = None) -> str:
        """
        Saves the trained model and associated metadata to disk via joblib.

        Args:
            model_dir (Optional[str]): Directory path to save model artifact.

        Returns:
            str: Path to the saved .joblib file.
        """
        path = model_dir or self._model_dir
        if not path:
            raise ValueError("No model directory specified.")

        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'production_forecast.joblib')

        payload = {
            'model': self.model,
            'feature_names': self.feature_names,
            'r2_score': self.r2_score,
            'mae': self.mae,
            'rmse': self.rmse,
            'version': self.version,
            'last_trained': self.last_trained
        }
        joblib.dump(payload, filepath)
        logger.info(f"Production forecast model saved successfully to: {filepath}")
        return filepath

    def load(self, model_dir: Optional[str] = None) -> bool:
        """
        Loads a pre-trained model artifact from disk.

        Args:
            model_dir (Optional[str]): Directory path where model artifact resides.

        Returns:
            bool: True if loaded successfully, False if file was not found.
        """
        path = model_dir or self._model_dir
        if not path:
            return False

        filepath = os.path.join(path, 'production_forecast.joblib')
        if not os.path.exists(filepath):
            logger.warning(f"No saved ProductionForecast model found at: {filepath}")
            return False

        try:
            payload = joblib.load(filepath)
            self.model = payload['model']
            self.feature_names = payload.get('feature_names')
            self.r2_score = payload.get('r2_score', 0.0)
            self.mae = payload.get('mae', 0.0)
            self.rmse = payload.get('rmse', 0.0)
            self.version = payload.get('version', '1.0.0')
            self.last_trained = payload.get('last_trained')
            logger.info(f"Production forecast model loaded from: {filepath} (v{self.version})")
            return True
        except Exception as e:
            logger.error(f"Failed loading production forecast model: {e}")
            return False

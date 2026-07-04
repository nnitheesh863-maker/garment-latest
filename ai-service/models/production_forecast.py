import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from config import setup_logging

logger = setup_logging(__name__)


class ProductionForecast:
    def __init__(self, model_dir=None):
        self.model = None
        self.feature_names = None
        self.r2_score = 0.0
        self.mae = 0.0
        self.rmse = 0.0
        self.version = '1.0.0'
        self.last_trained = None
        self._model_dir = model_dir

    def _extract_features(self, df):
        df = df.copy()
        if 'order_date' in df.columns:
            df['order_date'] = pd.to_datetime(df['order_date'])
            df['day_of_week'] = df['order_date'].dt.dayofweek
            df['month'] = df['order_date'].dt.month
        features = pd.DataFrame()
        features['day_of_week'] = df.get('day_of_week', df.get('day_of_week', 0))
        features['month'] = df.get('month', df.get('month', 1))
        features['employee_count'] = pd.to_numeric(df.get('employee_count', df.get('employee_count', 50)), errors='coerce').fillna(50)
        features['machine_count'] = pd.to_numeric(df.get('machine_count', df.get('machine_count', 20)), errors='coerce').fillna(20)
        features['order_volume'] = pd.to_numeric(df.get('order_volume', df.get('order_quantity', 1000)), errors='coerce').fillna(1000)

        extra_features = [
            'lead_time_days', 'order_priority_score', 'capacity_utilization',
            'is_weekend', 'quarter', 'day_of_month'
        ]
        for col in extra_features:
            if col in df.columns:
                features[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return features

    def train(self, historical_data, target_column='actual_quantity'):
        df = pd.DataFrame(historical_data) if not isinstance(historical_data, pd.DataFrame) else historical_data.copy()
        logger.info(f"Training ProductionForecast on {df.shape[0]} records")

        features = self._extract_features(df)
        self.feature_names = features.columns.tolist()

        if target_column in df.columns:
            target = pd.to_numeric(df[target_column], errors='coerce').fillna(0)
        else:
            target = pd.to_numeric(df.get('order_quantity', 1000), errors='coerce').fillna(1000)

        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )

        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        self.r2_score = r2_score(y_test, y_pred)
        self.mae = mean_absolute_error(y_test, y_pred)
        self.rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        logger.info(f"Training complete - R2: {self.r2_score:.4f}, MAE: {self.mae:.2f}, RMSE: {self.rmse:.2f}")
        logger.info(f"Top features: {dict(sorted(feature_importance.items(), key=lambda x: -x[1])[:3])}")

        from datetime import datetime
        self.last_trained = datetime.now().isoformat()
        return {
            'r2_score': self.r2_score,
            'mae': self.mae,
            'rmse': self.rmse,
            'feature_importance': feature_importance
        }

    def predict(self, features):
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        df = pd.DataFrame([features]) if isinstance(features, dict) else pd.DataFrame(features)
        processed = self._extract_features(df)

        if self.feature_names:
            for col in self.feature_names:
                if col not in processed.columns:
                    processed[col] = 0
            processed = processed[self.feature_names]

        predictions = self.model.predict(processed)

        tree_preds = np.array([
            tree.predict(processed.values) for tree in self.model.estimators_
        ])
        std_dev = np.std(tree_preds, axis=0)

        results = []
        for i, pred in enumerate(predictions):
            ci_lower = pred - 1.96 * std_dev[i]
            ci_upper = pred + 1.96 * std_dev[i]

            trend = 'upward' if std_dev[i] / (pred + 1e-8) > 0.1 else 'stable'
            if ci_lower > pred:
                trend = 'downward'

            results.append({
                'predicted_quantity': round(float(pred), 2),
                'confidence_interval': {
                    'lower': round(float(max(ci_lower, 0)), 2),
                    'upper': round(float(ci_upper), 2)
                },
                'trend_direction': trend,
                'confidence_score': round(float(max(0, min(1, 1 - std_dev[i] / (pred + 1e-8)))), 4)
            })

        return results[0] if len(results) == 1 else results

    def save(self, model_dir=None):
        path = model_dir or self._model_dir
        os.makedirs(path, exist_ok=True)
        filepath = os.path.join(path, 'production_forecast.joblib')
        data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'r2_score': self.r2_score,
            'mae': self.mae,
            'rmse': self.rmse,
            'version': self.version,
            'last_trained': self.last_trained
        }
        joblib.dump(data, filepath)
        logger.info(f"Model saved to {filepath}")
        return filepath

    def load(self, model_dir=None):
        path = model_dir or self._model_dir
        filepath = os.path.join(path, 'production_forecast.joblib')
        if not os.path.exists(filepath):
            logger.warning(f"No saved model found at {filepath}")
            return False
        data = joblib.load(filepath)
        self.model = data['model']
        self.feature_names = data.get('feature_names')
        self.r2_score = data.get('r2_score', 0.0)
        self.mae = data.get('mae', 0.0)
        self.rmse = data.get('rmse', 0.0)
        self.version = data.get('version', '1.0.0')
        self.last_trained = data.get('last_trained')
        logger.info(f"Model loaded from {filepath} (version {self.version})")
        return True

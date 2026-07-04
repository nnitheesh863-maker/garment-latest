import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from config import setup_logging

logger = setup_logging(__name__)


def handle_missing_values(df, strategy='mean'):
    df = df.copy()
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns

    for col in numeric_cols:
        missing_count = df[col].isnull().sum()
        if missing_count > 0:
            logger.info(f"Imputing {missing_count} missing values in numeric column '{col}'")
            if strategy == 'mean':
                df[col].fillna(df[col].mean(), inplace=True)
            elif strategy == 'median':
                df[col].fillna(df[col].median(), inplace=True)
            elif strategy == 'drop':
                df.dropna(subset=[col], inplace=True)
            else:
                df[col].fillna(0, inplace=True)

    for col in categorical_cols:
        missing_count = df[col].isnull().sum()
        if missing_count > 0:
            logger.info(f"Imputing {missing_count} missing values in categorical column '{col}'")
            df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'unknown', inplace=True)

    return df


def normalize_features(df, scaler=None, columns=None):
    df = df.copy()
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns.tolist()

    if not columns:
        return df, scaler

    if scaler is None:
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
    else:
        df[columns] = scaler.transform(df[columns])

    return df, scaler


def encode_categorical(df, encoder=None, columns=None):
    df = df.copy()
    if columns is None:
        columns = df.select_dtypes(include=['object', 'category']).columns.tolist()

    if not columns:
        return df, encoder

    if encoder is None:
        encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        encoded = encoder.fit_transform(df[columns])
        feature_names = encoder.get_feature_names_out(columns)
    else:
        encoded = encoder.transform(df[columns])
        feature_names = encoder.get_feature_names_out(columns)

    encoded_df = pd.DataFrame(encoded, columns=feature_names, index=df.index)
    df = df.drop(columns=columns)
    df = pd.concat([df, encoded_df], axis=1)

    return df, encoder


def preprocess_order_data(raw_data):
    df = pd.DataFrame(raw_data) if not isinstance(raw_data, pd.DataFrame) else raw_data.copy()

    df = handle_missing_values(df)

    if 'order_date' in df.columns:
        df['order_date'] = pd.to_datetime(df['order_date'])
        df['day_of_week'] = df['order_date'].dt.dayofweek
        df['month'] = df['order_date'].dt.month
        df['quarter'] = df['order_date'].dt.quarter
        df['day_of_month'] = df['order_date'].dt.day
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)

    if 'delivery_date' in df.columns:
        df['delivery_date'] = pd.to_datetime(df['delivery_date'])
        df['lead_time_days'] = (df['delivery_date'] - pd.to_datetime(df['order_date'])).dt.days

    if 'order_priority' in df.columns:
        priority_map = {'low': 1, 'medium': 2, 'high': 3, 'urgent': 4}
        df['order_priority_score'] = df['order_priority'].str.lower().map(priority_map).fillna(2)

    if 'order_quantity' in df.columns and 'production_capacity' in df.columns:
        df['capacity_utilization'] = df['order_quantity'] / (df['production_capacity'] + 1e-8)

    if 'order_complexity' not in df.columns:
        df['order_complexity'] = 5

    logger.info(f"Preprocessed order data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def preprocess_employee_data(raw_data):
    df = pd.DataFrame(raw_data) if not isinstance(raw_data, pd.DataFrame) else raw_data.copy()

    df = handle_missing_values(df)

    if 'hire_date' in df.columns:
        df['hire_date'] = pd.to_datetime(df['hire_date'])
        df['years_of_experience'] = (pd.Timestamp.now() - df['hire_date']).dt.days / 365.0

    if 'attendance_rate' not in df.columns:
        df['attendance_rate'] = 0.95

    if 'overtime_hours' in df.columns and 'regular_hours' in df.columns:
        df['overtime_ratio'] = df['overtime_hours'] / (df['regular_hours'] + 1e-8)

    if 'tasks_completed' in df.columns and 'tasks_assigned' in df.columns:
        df['completion_rate'] = df['tasks_completed'] / (df['tasks_assigned'] + 1e-8)

    if 'defects_count' in df.columns and 'total_products' in df.columns:
        df['quality_score'] = 1 - (df['defects_count'] / (df['total_products'] + 1e-8))

    logger.info(f"Preprocessed employee data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def preprocess_machine_data(raw_data):
    df = pd.DataFrame(raw_data) if not isinstance(raw_data, pd.DataFrame) else raw_data.copy()

    df = handle_missing_values(df)

    if 'last_maintenance_date' in df.columns:
        df['last_maintenance_date'] = pd.to_datetime(df['last_maintenance_date'])
        df['hours_since_maintenance'] = (
            pd.Timestamp.now() - df['last_maintenance_date']
        ).dt.total_seconds() / 3600.0

    if 'installation_date' in df.columns:
        df['installation_date'] = pd.to_datetime(df['installation_date'])
        df['age_days'] = (pd.Timestamp.now() - df['installation_date']).dt.days

    if 'operating_hours' not in df.columns:
        df['operating_hours'] = 0

    if 'maintenance_count' in df.columns and 'age_days' in df.columns:
        df['maintenance_frequency'] = df['maintenance_count'] / (df['age_days'] + 1e-8)

    df['vibration_level'] = df.get('vibration_level', pd.Series(0.5, index=df.index))
    df['temperature'] = df.get('temperature', pd.Series(70.0, index=df.index))
    df['speed'] = df.get('speed', pd.Series(100.0, index=df.index))
    df['power_usage'] = df.get('power_usage', pd.Series(50.0, index=df.index))

    logger.info(f"Preprocessed machine data: {df.shape[0]} rows, {df.shape[1]} columns")
    return df

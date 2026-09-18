"""
Data Preprocessing Utility Module
=================================
This module provides data cleaning, missing value imputation, feature engineering,
normalization, and categorical encoding functions for order, employee, and machine datasets.
"""

from typing import Tuple, List, Optional, Union, Dict, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from config import setup_logging

logger = setup_logging(__name__)


# =====================================================================
# General Cleaning & Imputation Utilities
# =====================================================================

def handle_missing_values(df: pd.DataFrame, strategy: str = 'mean') -> pd.DataFrame:
    """
    Cleans a DataFrame by imputing or dropping missing values.

    Args:
        df (pd.DataFrame): Raw input dataframe.
        strategy (str): Imputation strategy for numerical values ('mean', 'median', 'zero', 'drop').

    Returns:
        pd.DataFrame: Cleaned dataframe with missing values handled.
    """
    df = df.copy()
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns

    # 1. Impute numeric columns
    for col in numeric_cols:
        missing_count = df[col].isnull().sum()
        if missing_count > 0:
            logger.debug(f"Imputing {missing_count} missing values in numeric column '{col}' using '{strategy}'")
            if strategy == 'mean':
                mean_val = df[col].mean()
                df[col] = df[col].fillna(mean_val if not pd.isna(mean_val) else 0)
            elif strategy == 'median':
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val if not pd.isna(median_val) else 0)
            elif strategy == 'drop':
                df = df.dropna(subset=[col])
            else:
                df[col] = df[col].fillna(0)

    # 2. Impute categorical columns with the mode (most frequent value) or 'unknown'
    for col in categorical_cols:
        missing_count = df[col].isnull().sum()
        if missing_count > 0:
            logger.debug(f"Imputing {missing_count} missing values in categorical column '{col}'")
            mode_series = df[col].mode()
            fill_val = mode_series.iloc[0] if not mode_series.empty else 'unknown'
            df[col] = df[col].fillna(fill_val)

    return df


def normalize_features(
    df: pd.DataFrame,
    scaler: Optional[StandardScaler] = None,
    columns: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, StandardScaler]:
    """
    Standardizes numeric features to zero mean and unit variance.

    Args:
        df (pd.DataFrame): Input dataframe.
        scaler (Optional[StandardScaler]): Pre-fitted scaler instance, or None to fit a new one.
        columns (Optional[List[str]]): Specific columns to scale. Defaults to all numeric columns.

    Returns:
        Tuple[pd.DataFrame, StandardScaler]: Transformed dataframe and the scaler object.
    """
    df = df.copy()
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns.tolist()

    if not columns:
        return df, scaler or StandardScaler()

    if scaler is None:
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
    else:
        df[columns] = scaler.transform(df[columns])

    return df, scaler


def encode_categorical(
    df: pd.DataFrame,
    encoder: Optional[OneHotEncoder] = None,
    columns: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, OneHotEncoder]:
    """
    Performs One-Hot Encoding on categorical columns.

    Args:
        df (pd.DataFrame): Input dataframe.
        encoder (Optional[OneHotEncoder]): Pre-fitted encoder instance, or None to fit a new one.
        columns (Optional[List[str]]): Specific columns to encode. Defaults to object/category columns.

    Returns:
        Tuple[pd.DataFrame, OneHotEncoder]: Dataframe with one-hot encoded columns and encoder object.
    """
    df = df.copy()
    if columns is None:
        columns = df.select_dtypes(include=['object', 'category']).columns.tolist()

    if not columns:
        return df, encoder or OneHotEncoder(sparse_output=False, handle_unknown='ignore')

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


# =====================================================================
# Domain-Specific Feature Engineering Pipelines
# =====================================================================

def preprocess_order_data(raw_data: Union[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]) -> pd.DataFrame:
    """
    Preprocesses raw garment production order data and extracts predictive temporal & operational features.

    Engineered Features:
    - Temporal: `day_of_week`, `month`, `quarter`, `day_of_month`, `is_weekend`
    - Operational: `lead_time_days` (time window for production)
    - Priority: `order_priority_score` (numeric mapping: low=1, medium=2, high=3, urgent=4)
    - Capacity: `capacity_utilization` (ratio of order volume to total capacity)

    Args:
        raw_data: List of dicts, single dict, or raw DataFrame.

    Returns:
        pd.DataFrame: Feature-engineered order DataFrame.
    """
    if isinstance(raw_data, dict):
        df = pd.DataFrame([raw_data])
    elif isinstance(raw_data, list):
        df = pd.DataFrame(raw_data)
    else:
        df = raw_data.copy()

    df = handle_missing_values(df)

    # 1. Temporal breakdown from order_date
    if 'order_date' in df.columns:
        df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')
        # Default NaT to current date if missing
        df['order_date'] = df['order_date'].fillna(pd.Timestamp.now())
        df['day_of_week'] = df['order_date'].dt.dayofweek
        df['month'] = df['order_date'].dt.month
        df['quarter'] = df['order_date'].dt.quarter
        df['day_of_month'] = df['order_date'].dt.day
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)

    # 2. Production lead time in days
    if 'delivery_date' in df.columns and 'order_date' in df.columns:
        delivery = pd.to_datetime(df['delivery_date'], errors='coerce')
        order = pd.to_datetime(df['order_date'], errors='coerce')
        df['lead_time_days'] = (delivery - order).dt.days.fillna(14)
    elif 'lead_time_days' not in df.columns:
        df['lead_time_days'] = 14

    # 3. Order priority mapping
    if 'order_priority' in df.columns:
        priority_map = {'low': 1, 'medium': 2, 'high': 3, 'urgent': 4}
        df['order_priority_score'] = df['order_priority'].astype(str).str.lower().map(priority_map).fillna(2)
    elif 'order_priority_score' not in df.columns:
        df['order_priority_score'] = 2

    # 4. Capacity utilization ratio
    if 'order_quantity' in df.columns and 'production_capacity' in df.columns:
        qty = pd.to_numeric(df['order_quantity'], errors='coerce').fillna(0)
        cap = pd.to_numeric(df['production_capacity'], errors='coerce').fillna(1)
        df['capacity_utilization'] = qty / (cap + 1e-8)
    elif 'capacity_utilization' not in df.columns:
        df['capacity_utilization'] = 0.75

    # 5. Default complexity score if missing (1 to 10 scale)
    if 'order_complexity' not in df.columns:
        df['order_complexity'] = 5

    logger.debug(f"Preprocessed order dataset shape: {df.shape}")
    return df


def preprocess_employee_data(raw_data: Union[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]) -> pd.DataFrame:
    """
    Preprocesses employee records and calculates operational efficiency and quality indicators.

    Engineered Features:
    - `years_of_experience`: Time elapsed since hiring date.
    - `overtime_ratio`: Overtime hours relative to standard regular hours.
    - `completion_rate`: Tasks completed divided by assigned tasks.
    - `quality_score`: Defect-free production percentage.

    Args:
        raw_data: List of employee records, single dict, or DataFrame.

    Returns:
        pd.DataFrame: Cleaned employee dataset with performance features.
    """
    if isinstance(raw_data, dict):
        df = pd.DataFrame([raw_data])
    elif isinstance(raw_data, list):
        df = pd.DataFrame(raw_data)
    else:
        df = raw_data.copy()

    df = handle_missing_values(df)

    # 1. Experience calculation
    if 'hire_date' in df.columns:
        hire = pd.to_datetime(df['hire_date'], errors='coerce')
        df['years_of_experience'] = (pd.Timestamp.now() - hire).dt.days / 365.0
        df['years_of_experience'] = df['years_of_experience'].fillna(3.0)
    elif 'years_of_experience' not in df.columns:
        df['years_of_experience'] = 3.0

    # 2. Attendance rate default
    if 'attendance_rate' not in df.columns:
        df['attendance_rate'] = 0.95

    # 3. Overtime load ratio
    if 'overtime_hours' in df.columns and 'regular_hours' in df.columns:
        ot = pd.to_numeric(df['overtime_hours'], errors='coerce').fillna(0)
        reg = pd.to_numeric(df['regular_hours'], errors='coerce').fillna(40)
        df['overtime_ratio'] = ot / (reg + 1e-8)

    # 4. Task completion rate
    if 'tasks_completed' in df.columns and 'tasks_assigned' in df.columns:
        completed = pd.to_numeric(df['tasks_completed'], errors='coerce').fillna(0)
        assigned = pd.to_numeric(df['tasks_assigned'], errors='coerce').fillna(1)
        df['completion_rate'] = completed / (assigned + 1e-8)

    # 5. Quality score
    if 'defects_count' in df.columns and 'total_products' in df.columns:
        defects = pd.to_numeric(df['defects_count'], errors='coerce').fillna(0)
        total = pd.to_numeric(df['total_products'], errors='coerce').fillna(1)
        df['quality_score'] = 1 - (defects / (total + 1e-8))

    logger.debug(f"Preprocessed employee dataset shape: {df.shape}")
    return df


def preprocess_machine_data(raw_data: Union[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]) -> pd.DataFrame:
    """
    Preprocesses sewing and manufacturing machine telemetry and maintenance records.

    Engineered Features:
    - `hours_since_maintenance`: Operating time elapsed since last scheduled service.
    - `age_days`: Physical age of the machine in days since installation.
    - `maintenance_frequency`: Maintenance count relative to machine age.
    - Standardized telemetry signals: vibration level, temperature, speed, power usage.

    Args:
        raw_data: Machine telemetry records or DataFrame.

    Returns:
        pd.DataFrame: Machine sensor and maintenance dataset.
    """
    if isinstance(raw_data, dict):
        df = pd.DataFrame([raw_data])
    elif isinstance(raw_data, list):
        df = pd.DataFrame(raw_data)
    else:
        df = raw_data.copy()

    df = handle_missing_values(df)

    # 1. Maintenance recency in hours
    if 'last_maintenance_date' in df.columns:
        last_maint = pd.to_datetime(df['last_maintenance_date'], errors='coerce')
        df['hours_since_maintenance'] = (
            pd.Timestamp.now() - last_maint
        ).dt.total_seconds() / 3600.0
        df['hours_since_maintenance'] = df['hours_since_maintenance'].fillna(168.0)
    elif 'hours_since_maintenance' not in df.columns:
        df['hours_since_maintenance'] = 168.0  # Default: 1 week

    # 2. Machine age
    if 'installation_date' in df.columns:
        installed = pd.to_datetime(df['installation_date'], errors='coerce')
        df['age_days'] = (pd.Timestamp.now() - installed).dt.days.fillna(365)
    elif 'age_days' not in df.columns:
        df['age_days'] = 365

    # 3. Operating hours & maintenance frequency
    if 'operating_hours' not in df.columns:
        df['operating_hours'] = 0.0

    if 'maintenance_count' in df.columns and 'age_days' in df.columns:
        maint_cnt = pd.to_numeric(df['maintenance_count'], errors='coerce').fillna(0)
        age = pd.to_numeric(df['age_days'], errors='coerce').fillna(1)
        df['maintenance_frequency'] = maint_cnt / (age + 1e-8)

    # 4. Standard sensor defaults if absent
    if 'vibration_level' not in df.columns and 'vibration' in df.columns:
        df['vibration_level'] = df['vibration']
    elif 'vibration_level' not in df.columns:
        df['vibration_level'] = 0.5

    if 'temperature' not in df.columns:
        df['temperature'] = 70.0

    if 'speed' not in df.columns:
        df['speed'] = 100.0

    if 'power_usage' not in df.columns:
        df['power_usage'] = 50.0

    logger.debug(f"Preprocessed machine dataset shape: {df.shape}")
    return df

"""
Configuration Module for AI Service
===================================
This module centralizes all environment variables, default settings,
model directories, logging configurations, and model version definitions.
"""

import os
import logging
from typing import Dict
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


class Config:
    """Central configuration class for the AI microservice."""

    # ---------------------------------------------------------
    # Database & Networking Settings
    # ---------------------------------------------------------
    MONGO_URI: str = os.getenv('MONGO_URI', 'mongodb://localhost:27017/garment_production')
    PORT: int = int(os.getenv('PORT', 5001))
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'

    # ---------------------------------------------------------
    # Model Storage & Persistence
    # ---------------------------------------------------------
    # Directory where trained joblib model binaries are saved and loaded
    MODEL_DIR: str = os.getenv(
        'MODEL_DIR',
        os.path.join(os.path.dirname(__file__), 'models', 'saved')
    )

    # ---------------------------------------------------------
    # Logging Configuration
    # ---------------------------------------------------------
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # ---------------------------------------------------------
    # AI Pipeline & Operational Hyperparameters
    # ---------------------------------------------------------
    # Cache time-to-live in seconds (prevents recalculating identical predictions)
    CACHE_TTL_SECONDS: int = int(os.getenv('CACHE_TTL_SECONDS', 300))

    # Background retraining interval in hours
    RETRAIN_INTERVAL_HOURS: int = int(os.getenv('RETRAIN_INTERVAL_HOURS', 24))

    # Confidence threshold for high-certainty predictions
    CONFIDENCE_THRESHOLD: float = float(os.getenv('CONFIDENCE_THRESHOLD', 0.8))

    # ---------------------------------------------------------
    # Model Versions Tracker
    # ---------------------------------------------------------
    MODEL_VERSIONS: Dict[str, str] = {
        'production_forecast': '1.0.0',
        'delay_prediction': '1.0.0',
        'failure_prediction': '1.0.0',
        'performance_analysis': '1.0.0',
    }


def setup_logging(name: str = 'ai-service') -> logging.Logger:
    """
    Configures and returns a standardized logger instance.

    Args:
        name (str): The name for the logger (defaults to 'ai-service').

    Returns:
        logging.Logger: Configured logger with formatted stream handler.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        level = getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO)
        logger.setLevel(level)

        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(Config.LOG_FORMAT))
        logger.addHandler(handler)

    return logger

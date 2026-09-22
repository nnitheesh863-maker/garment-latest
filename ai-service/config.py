"""
Configuration Module for AI Service
===================================
This module centralizes all environment variables, default settings,
model directories, logging configurations, and model version definitions.
"""

import os
import sys
import logging
from typing import Dict

# Ensure the ai-service root directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Load environment variables from .env file if present (with fallback if python-dotenv is missing)
try:
    from dotenv import load_dotenv
    env_paths = [
        os.path.join(BASE_DIR, '.env'),
        os.path.join(BASE_DIR, '..', '.env'),
        os.path.join(BASE_DIR, '..', '..', '.env'),
    ]
    loaded = False
    for env_path in env_paths:
        if os.path.isfile(env_path):
            load_dotenv(dotenv_path=env_path)
            loaded = True
            break
    if not loaded:
        load_dotenv()
except (ImportError, Exception):
    def load_dotenv(*args, **kwargs):
        pass


def _get_port() -> int:
    """Safely retrieves the AI service port avoiding collision with backend port 5000."""
    port_env = os.getenv('AI_SERVICE_PORT') or os.getenv('AI_PORT')
    if port_env:
        try:
            return int(port_env)
        except ValueError:
            pass
    port_generic = os.getenv('PORT')
    if port_generic and str(port_generic).strip() != '5000':
        try:
            return int(port_generic)
        except ValueError:
            pass
    return 5001


class Config:
    """Central configuration class for the AI microservice."""

    # ---------------------------------------------------------
    # Database & Networking Settings
    # ---------------------------------------------------------
    MONGO_URI: str = os.getenv('MONGO_URI', 'mongodb://localhost:27017/garment_production')
    PORT: int = _get_port()
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() in ('true', '1', 'yes')

    # ---------------------------------------------------------
    # Model Storage & Persistence
    # ---------------------------------------------------------
    # Directory where trained joblib model binaries are saved and loaded
    MODEL_DIR: str = os.getenv(
        'MODEL_DIR',
        os.path.join(BASE_DIR, 'models', 'saved')
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


# Ensure model directory exists
try:
    os.makedirs(Config.MODEL_DIR, exist_ok=True)
except Exception:
    pass


LOG_LEVEL_MAP = {
    'CRITICAL': logging.CRITICAL,
    'FATAL': logging.CRITICAL,
    'ERROR': logging.ERROR,
    'WARN': logging.WARNING,
    'WARNING': logging.WARNING,
    'INFO': logging.INFO,
    'DEBUG': logging.DEBUG,
    'NOTSET': logging.NOTSET,
}


def setup_logging(name: str = 'ai-service') -> logging.Logger:
    """
    Configures and returns a standardized logger instance safely.

    Args:
        name (str): The name for the logger (defaults to 'ai-service').

    Returns:
        logging.Logger: Configured logger with formatted stream handler.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        default_level = getattr(Config, 'LOG_LEVEL', 'INFO') if 'Config' in globals() else 'INFO'
        env_level = os.getenv('LOG_LEVEL', default_level)
        log_level_name = str(env_level).strip().upper()

        level = LOG_LEVEL_MAP.get(log_level_name, logging.INFO)
        if not isinstance(level, int):
            level = logging.INFO

        logger.setLevel(level)

        log_format = getattr(Config, 'LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s') if 'Config' in globals() else '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(log_format))
        logger.addHandler(handler)

    return logger



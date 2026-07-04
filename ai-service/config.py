import os
import logging
from dotenv import load_dotenv

load_dotenv()


class Config:
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/garment_production')
    PORT = int(os.getenv('PORT', 5001))
    MODEL_DIR = os.getenv('MODEL_DIR', os.path.join(os.path.dirname(__file__), 'models', 'saved'))
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    CACHE_TTL_SECONDS = int(os.getenv('CACHE_TTL_SECONDS', 300))
    RETRAIN_INTERVAL_HOURS = int(os.getenv('RETRAIN_INTERVAL_HOURS', 24))
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.8))

    MODEL_VERSIONS = {
        'production_forecast': '1.0.0',
        'delay_prediction': '1.0.0',
        'failure_prediction': '1.0.0',
        'performance_analysis': '1.0.0',
    }


def setup_logging(name='ai-service'):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(getattr(logging, Config.LOG_LEVEL))
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(Config.LOG_FORMAT))
        logger.addHandler(handler)
    return logger

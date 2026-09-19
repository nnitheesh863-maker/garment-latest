"""
AI Service Microservice Main Application
FastAPI / Flask application serving ML inference and analytics endpoints.
"""
"""
Flask REST API Entrypoint for AI Microservice
==============================================
Provides high-performance RESTful API endpoints for garment production forecasting,
delivery delay prediction, predictive maintenance, and workforce analytics.
"""

import os
import sys
from typing import Dict, Any, Tuple
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from config import Config, setup_logging
from models.production_forecast import ProductionForecast
from models.delay_prediction import DelayPrediction
from models.performance_analysis import PerformanceAnalysis
from models.failure_prediction import FailurePrediction
from services.prediction_service import PredictionService
from services.training_service import TrainingService

logger = setup_logging(__name__)

# =====================================================================
# Model & Service Singletons Initialization
# =====================================================================

production_model = ProductionForecast(model_dir=Config.MODEL_DIR)
delay_model = DelayPrediction(model_dir=Config.MODEL_DIR)
performance_analyzer = PerformanceAnalysis()
failure_model = FailurePrediction(model_dir=Config.MODEL_DIR)

prediction_service = PredictionService(
    production_model=production_model,
    delay_model=delay_model,
    performance_analyzer=performance_analyzer,
    failure_model=failure_model
)

training_service = TrainingService(
    production_model=production_model,
    delay_model=delay_model,
    performance_analyzer=performance_analyzer,
    failure_model=failure_model
)


def create_app() -> Flask:
    """
    Application factory that sets up Flask routes, error handlers, and CORS.

    Returns:
        Flask: The initialized Flask application instance.
    """
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # -----------------------------------------------------------------
    # Standard Error Handlers
    # -----------------------------------------------------------------

    @app.errorhandler(400)
    def bad_request(e) -> Tuple[Response, int]:
        return jsonify({
            'error': 'Bad Request',
            'message': str(getattr(e, 'description', 'Invalid request payload')),
            'status_code': 400
        }), 400

    @app.errorhandler(404)
    def not_found(e) -> Tuple[Response, int]:
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested endpoint was not found on this server',
            'status_code': 404
        }), 404

    @app.errorhandler(500)
    def server_error(e) -> Tuple[Response, int]:
        logger.error(f"Internal server error: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred during processing',
            'status_code': 500
        }), 500

    # -----------------------------------------------------------------
    # Core AI Prediction Endpoint
    # -----------------------------------------------------------------

    @app.route('/api/predict', methods=['POST'])
    def predict() -> Tuple[Response, int]:
        """
        Unified prediction endpoint for all model types.

        Request Body JSON:
        {
            "type": "production" | "delay" | "performance" | "failure",
            "data": { ... }
        }

        Returns:
            JSON response with prediction result or error status.
        """
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Bad Request', 'message': 'No input JSON provided'}), 400

            prediction_type = str(data.get('type', 'production')).lower()
            input_data = data.get('data', data)

            if prediction_type == 'production':
                result = prediction_service.get_production_forecast(input_data)
            elif prediction_type == 'delay':
                result = prediction_service.get_delay_prediction(input_data)
            elif prediction_type == 'performance':
                employees = input_data if isinstance(input_data, list) else input_data.get('employees', [input_data])
                result = prediction_service.get_performance_analysis(employees)
            elif prediction_type == 'failure':
                result = prediction_service.get_failure_prediction(input_data)
            else:
                return jsonify({
                    'error': 'Invalid Type',
                    'message': f"Unsupported prediction type: '{prediction_type}'. Valid: production, delay, performance, failure"
                }), 400

            return jsonify({'success': True, 'result': result}), 200

        except RuntimeError as e:
            logger.warning(f"Model unavailable: {e}")
            return jsonify({'error': 'Model Not Ready', 'message': str(e)}), 503
        except Exception as e:
            logger.error(f"Prediction execution error: {e}", exc_info=True)
            return jsonify({'error': 'Prediction Failed', 'message': str(e)}), 500

    # -----------------------------------------------------------------
    # Cross-Resource Aggregate Analysis Endpoint
    # -----------------------------------------------------------------

    @app.route('/api/analyze', methods=['POST'])
    def analyze() -> Tuple[Response, int]:
        """
        Executes an end-to-end composite analysis across production orders,
        machinery, and personnel to return a holistic operational overview.
        """
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Bad Request', 'message': 'No input JSON provided'}), 400

            result = prediction_service.aggregate_analysis(data)
            return jsonify({'success': True, 'result': result}), 200

        except RuntimeError as e:
            logger.warning(f"Model unavailable during aggregate analysis: {e}")
            return jsonify({'error': 'Model Not Ready', 'message': str(e)}), 503
        except Exception as e:
            logger.error(f"Aggregate analysis error: {e}", exc_info=True)
            return jsonify({'error': 'Analysis Failed', 'message': str(e)}), 500

    # -----------------------------------------------------------------
    # Prescriptive Recommendations Endpoint
    # -----------------------------------------------------------------

    @app.route('/api/recommendations', methods=['GET', 'POST'])
    def recommendations() -> Tuple[Response, int]:
        """
        Generates prioritized action recommendations for production managers.
        Supports both GET query parameters and POST JSON payloads.
        """
        try:
            if request.method == 'POST':
                data = request.get_json() or {}
            else:
                data = {
                    'production': {
                        'order_date': request.args.get('order_date', '2024-01-15'),
                        'employee_count': int(request.args.get('employee_count', 50)),
                        'machine_count': int(request.args.get('machine_count', 20)),
                        'order_volume': int(request.args.get('order_volume', 2000)),
                    },
                    'employees': [],
                    'machines': [],
                    'orders': []
                }

            result = prediction_service.get_recommendations(data)
            return jsonify({'success': True, 'result': result}), 200

        except Exception as e:
            logger.error(f"Failed generating recommendations: {e}", exc_info=True)
            return jsonify({'error': 'Recommendation Generation Failed', 'message': str(e)}), 500

    # -----------------------------------------------------------------
    # Model Training & Retraining Trigger Endpoint
    # -----------------------------------------------------------------

    @app.route('/api/train', methods=['POST'])
    def train() -> Tuple[Response, int]:
        """
        Triggers on-demand model retraining for one or all models.

        Request Body JSON:
        {
            "type": "all" | "production" | "delay" | "failure",
            "data": optional training records
        }
        """
        try:
            data = request.get_json() or {}
            model_type = str(data.get('type', 'all')).lower()

            if model_type == 'all':
                result = training_service.train_all_models()
            elif model_type == 'production':
                result = training_service.train_production_model(data.get('data'))
            elif model_type == 'delay':
                result = training_service.train_delay_model(data.get('data'))
            elif model_type == 'failure':
                result = training_service.train_failure_model(data.get('data'))
            else:
                return jsonify({
                    'error': 'Invalid Model Type',
                    'message': f"Unknown model type: '{model_type}'. Valid: all, production, delay, failure"
                }), 400

            return jsonify({'success': True, 'result': result}), 200

        except Exception as e:
            logger.error(f"Training pipeline error: {e}", exc_info=True)
            return jsonify({'error': 'Training Failed', 'message': str(e)}), 500

    # -----------------------------------------------------------------
    # System Status & Health Endpoints
    # -----------------------------------------------------------------

    @app.route('/api/model-status', methods=['GET'])
    def model_status() -> Tuple[Response, int]:
        """Returns accuracy metrics, version numbers, and training timestamps for all models."""
        try:
            status = training_service.get_model_status()
            return jsonify({'success': True, 'result': status}), 200
        except Exception as e:
            logger.error(f"Status check error: {e}", exc_info=True)
            return jsonify({'error': 'Failed retrieving model status', 'message': str(e)}), 500

    @app.route('/api/dashboard', methods=['GET'])
    def dashboard() -> Tuple[Response, int]:
        """Provides consolidated telemetry for the frontend executive dashboard."""
        try:
            data = prediction_service.get_dashboard_data()
            return jsonify({'success': True, 'result': data}), 200
        except Exception as e:
            logger.error(f"Dashboard telemetry error: {e}", exc_info=True)
            return jsonify({'error': 'Failed retrieving dashboard data', 'message': str(e)}), 500

    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health() -> Tuple[Response, int]:
        """Service liveness and readiness probe for Docker / load balancers."""
        models_status = training_service.get_model_status()
        return jsonify({
            'status': 'healthy',
            'service': 'ai-service',
            'version': '1.0.0',
            'models': models_status,
        }), 200

    return app


app = create_app()


def load_and_train_on_startup():
    """
    Initializes model state on application startup.
    Loads models from disk if present, otherwise bootstraps with training data.
    """
    logger.info("Initializing models on microservice startup...")
    loaded = training_service.load_models()
    any_loaded = any(loaded.values())

    if not any_loaded:
        logger.info("No saved model binaries found. Bootstrapping with initial training data...")
        try:
            training_service.train_all_models()
            logger.info("Bootstrap training complete. All models ready.")
        except Exception as e:
            logger.error(f"Bootstrap training failed on startup: {e}")
    else:
        logger.info("Pre-trained model binaries successfully loaded into memory.")


if __name__ == '__main__':
    load_and_train_on_startup()
    training_service.schedule_retraining(interval_hours=Config.RETRAIN_INTERVAL_HOURS)

    # In production on Linux, Gunicorn is used. On Windows or debug mode, use app.run
    if Config.DEBUG or sys.platform.startswith('win'):
        logger.info(f"Starting development Flask server on port {Config.PORT}")
        app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
    else:
        try:
            from gunicorn.app.base import BaseApplication

            class GunicornApplication(BaseApplication):
                def __init__(self, app_instance, options=None):
                    self.application = app_instance
                    self.options = options or {}
                    super().__init__()

                def load_config(self):
                    for key, value in self.options.items():
                        self.cfg.set(key, value)

                def load(self):
                    return self.application

            gunicorn_options = {
                'bind': f'0.0.0.0:{Config.PORT}',
                'workers': 2,
                'timeout': 120,
                'accesslog': '-',
                'errorlog': '-',
                'loglevel': Config.LOG_LEVEL.lower(),
            }
            logger.info(f"Starting Gunicorn server on port {Config.PORT}")
            GunicornApplication(app, gunicorn_options).run()
        except ImportError:
            logger.info(f"Gunicorn not available, falling back to Flask server on port {Config.PORT}")
            app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)

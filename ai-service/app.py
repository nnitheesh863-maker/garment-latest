import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config, setup_logging

logger = setup_logging(__name__)

from models.production_forecast import ProductionForecast
from models.delay_prediction import DelayPrediction
from models.performance_analysis import PerformanceAnalysis
from models.failure_prediction import FailurePrediction
from services.prediction_service import PredictionService
from services.training_service import TrainingService

production_model = ProductionForecast(model_dir=Config.MODEL_DIR)
delay_model = DelayPrediction(model_dir=Config.MODEL_DIR)
performance_analyzer = PerformanceAnalysis()
failure_model = FailurePrediction(model_dir=Config.MODEL_DIR)

prediction_service = PredictionService(
    production_model, delay_model, performance_analyzer, failure_model
)
training_service = TrainingService(
    production_model, delay_model, performance_analyzer, failure_model
)


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            'error': 'Bad Request',
            'message': str(e.description) if hasattr(e, 'description') else 'Invalid request parameters',
            'status_code': 400
        }), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'status_code': 404
        }), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }), 500

    @app.route('/api/predict', methods=['POST'])
    def predict():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No input data provided'}), 400

            prediction_type = data.get('type', 'production')
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
                return jsonify({'error': f"Unknown prediction type: {prediction_type}"}), 400

            return jsonify({'success': True, 'result': result}), 200

        except RuntimeError as e:
            logger.warning(f"Model not ready: {e}")
            return jsonify({'error': 'Model not trained', 'message': str(e)}), 503
        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            return jsonify({'error': 'Prediction failed', 'message': str(e)}), 500

    @app.route('/api/analyze', methods=['POST'])
    def analyze():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No input data provided'}), 400

            result = prediction_service.aggregate_analysis(data)
            return jsonify({'success': True, 'result': result}), 200

        except RuntimeError as e:
            logger.warning(f"Model not ready: {e}")
            return jsonify({'error': 'Model not trained', 'message': str(e)}), 503
        except Exception as e:
            logger.error(f"Analysis error: {e}", exc_info=True)
            return jsonify({'error': 'Analysis failed', 'message': str(e)}), 500

    @app.route('/api/recommendations', methods=['GET', 'POST'])
    def recommendations():
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
            logger.error(f"Recommendations error: {e}", exc_info=True)
            return jsonify({'error': 'Recommendation generation failed', 'message': str(e)}), 500

    @app.route('/api/train', methods=['POST'])
    def train():
        try:
            data = request.get_json() or {}
            model_type = data.get('type', 'all')

            if model_type == 'all':
                result = training_service.train_all_models()
            elif model_type == 'production':
                result = training_service.train_production_model(data.get('data'))
            elif model_type == 'delay':
                result = training_service.train_delay_model(data.get('data'))
            elif model_type == 'failure':
                result = training_service.train_failure_model(data.get('data'))
            else:
                return jsonify({'error': f"Unknown model type: {model_type}"}), 400

            return jsonify({'success': True, 'result': result}), 200

        except Exception as e:
            logger.error(f"Training error: {e}", exc_info=True)
            return jsonify({'error': 'Training failed', 'message': str(e)}), 500

    @app.route('/api/model-status', methods=['GET'])
    def model_status():
        try:
            status = training_service.get_model_status()
            return jsonify({'success': True, 'result': status}), 200
        except Exception as e:
            logger.error(f"Status error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to get model status', 'message': str(e)}), 500

    @app.route('/api/dashboard', methods=['GET'])
    def dashboard():
        try:
            data = prediction_service.get_dashboard_data()
            return jsonify({'success': True, 'result': data}), 200
        except Exception as e:
            logger.error(f"Dashboard error: {e}", exc_info=True)
            return jsonify({'error': 'Failed to get dashboard data', 'message': str(e)}), 500

    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health():
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
    logger.info("Loading models on startup...")
    loaded = training_service.load_models()
    any_loaded = any(loaded.values())

    if not any_loaded:
        logger.info("No saved models found. Training with sample data...")
        try:
            training_service.train_all_models()
            logger.info("Initial training complete.")
        except Exception as e:
            logger.error(f"Initial training failed: {e}")
    else:
        logger.info("Models loaded from disk.")


if __name__ == '__main__':
    load_and_train_on_startup()
    training_service.schedule_retraining(interval_hours=Config.RETRAIN_INTERVAL_HOURS)

    if Config.DEBUG:
        app.run(host='0.0.0.0', port=Config.PORT, debug=True)
    else:
        from gunicorn.app.base import BaseApplication

        class GunicornApplication(BaseApplication):
            def __init__(self, app, options=None):
                self.application = app
                self.options = options or {}
                super().__init__()

            def load_config(self):
                for key, value in self.options.items():
                    self.cfg.set(key, value)

            def load(self):
                return self.application

        options = {
            'bind': f'0.0.0.0:{Config.PORT}',
            'workers': 2,
            'timeout': 120,
            'accesslog': '-',
            'errorlog': '-',
            'loglevel': Config.LOG_LEVEL.lower(),
        }
        GunicornApplication(app, options).run()

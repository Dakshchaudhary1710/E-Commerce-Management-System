import os
import datetime
from decimal import Decimal
from flask import Flask, jsonify
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider

from routes.health_dashboard import health_dashboard_bp
from routes.customers import customers_bp
from routes.products import products_bp
from routes.categories import categories_bp
from routes.orders import orders_bp
from routes.payments import payments_bp
from routes.deliveries import deliveries_bp
from routes.reports import reports_bp

class CustomJSONProvider(DefaultJSONProvider):
    """
    Serializes MySQL Decimal values to floats, and date/datetime objects to ISO-8601 strings.
    """
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return super().default(o)

def create_app():
    app = Flask(__name__)
    app.json_provider_class = CustomJSONProvider
    app.json = CustomJSONProvider(app)

    # Enable Cross-Origin Resource Sharing for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints under /api prefix
    app.register_blueprint(health_dashboard_bp, url_prefix="/api")
    app.register_blueprint(customers_bp, url_prefix="/api")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")
    app.register_blueprint(payments_bp, url_prefix="/api")
    app.register_blueprint(deliveries_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def handle_internal_error(e):
        return jsonify({"error": "Internal server error occurred", "status_code": 500}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ["true", "1"]
    print(f"🚀 Starting Flask E-Commerce API Server on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)

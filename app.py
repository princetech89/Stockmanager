import os
import logging
from flask import Flask, render_template, request, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from database import db

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "inventory-management-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///inventory.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

# Import models BEFORE app context to avoid double registration
import models
import models_advanced

# Import routes and enhanced features
import routes
try:
    from enhanced_features import enhanced_bp
    app.register_blueprint(enhanced_bp)
    print("Enhanced features loaded successfully")
except ImportError as e:
    print(f"Enhanced features not loaded: {e}")

# Create tables and initialize data within app context
with app.app_context():
    db.create_all()
    
    # Initialize GST states
    try:
        models.GSTState.initialize_states()
        db.session.commit()
        print("Database initialized with GST states")
    except Exception as e:
        print(f"Error initializing GST states: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

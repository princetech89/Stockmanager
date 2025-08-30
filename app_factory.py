import os
import logging
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from extensions import db

def create_app():
    """Application factory pattern to prevent import issues"""
    app = Flask(__name__)
    
    # Configure logging
    logging.basicConfig(level=logging.DEBUG)
    
    # App configuration
    app.secret_key = os.environ.get("SESSION_SECRET", "inventory-management-secret-key")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///inventory.db")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints and routes within app context
    with app.app_context():
        # Import all models to ensure they are registered
        import all_models
        
        # Create database tables
        db.create_all()
        
        # Initialize GST states
        try:
            from models import GSTState
            GSTState.initialize_states()
            db.session.commit()
            print("Database initialized with GST states")
        except Exception as e:
            print(f"GST initialization: {e}")
        
        # Register routes
        import routes
        
        # Register enhanced features
        try:
            from enhanced_features import enhanced_bp
            app.register_blueprint(enhanced_bp)
            print("Enhanced features loaded successfully")
        except ImportError as e:
            print(f"Enhanced features not loaded: {e}")
    
    return app
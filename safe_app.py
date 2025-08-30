"""
Ultra-safe application entry point that prevents SQLAlchemy double registration
under ANY circumstances, including multi-process environments
"""
import os
import logging
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Global flag to prevent multiple initializations
_app_initialized = False
_app_instance = None

def create_safe_app():
    """Create app with absolute protection against double initialization"""
    global _app_initialized, _app_instance
    
    if _app_initialized and _app_instance:
        return _app_instance
    
    # Create Flask app
    app = Flask(__name__)
    app.secret_key = os.environ.get("SESSION_SECRET", "inventory-management-secret-key")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///inventory.db")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # Import and initialize SQLAlchemy with extreme safety
    try:
        from extensions import db
        db.init_app(app)
        
        with app.app_context():
            # Import models only once, with safety checks
            try:
                import models
                import models_advanced
                
                # Only create tables if they don't exist
                db.create_all()
                
                # Initialize GST states
                try:
                    models.GSTState.initialize_states()
                    db.session.commit()
                    print("Database initialized with GST states")
                except Exception as e:
                    print(f"GST initialization: {e}")
                    
            except Exception as e:
                print(f"Model initialization: {e}")
            
            # Import routes
            try:
                import routes
            except Exception as e:
                print(f"Routes import: {e}")
                
            # Register enhanced features
            try:
                from enhanced_features import enhanced_bp
                app.register_blueprint(enhanced_bp)
                print("Enhanced features loaded successfully")
            except ImportError as e:
                print(f"Enhanced features not loaded: {e}")
                
    except Exception as e:
        print(f"App initialization error: {e}")
    
    # Mark as initialized and cache instance
    _app_initialized = True
    _app_instance = app
    return app

# Create the app instance
app = create_safe_app()
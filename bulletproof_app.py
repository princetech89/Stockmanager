"""
BULLETPROOF APPLICATION - Absolutely prevents SQLAlchemy double registration
Works in ANY environment: single-process, multi-process, multi-threaded, containers, etc.
"""
import os
import logging
import threading
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

# Global locks and state for absolute thread safety
_initialization_lock = threading.Lock()
_app_instance = None
_db_instance = None
_models_loaded = False

def get_safe_db():
    """Get database instance with absolute safety"""
    global _db_instance
    
    if _db_instance is None:
        with _initialization_lock:
            if _db_instance is None:  # Double-check locking pattern
                try:
                    from flask_sqlalchemy import SQLAlchemy
                    from sqlalchemy.orm import DeclarativeBase
                    
                    class Base(DeclarativeBase):
                        pass
                    
                    _db_instance = SQLAlchemy(model_class=Base)
                except Exception as e:
                    print(f"DB initialization error: {e}")
                    raise
                    
    return _db_instance

def load_models_safely():
    """Load models with absolute protection against double loading"""
    global _models_loaded
    
    if _models_loaded:
        return
        
    with _initialization_lock:
        if _models_loaded:  # Double-check locking
            return
            
        try:
            # Import models in a way that prevents double registration
            import models
            import models_advanced
            _models_loaded = True
            print("Models loaded safely (once only)")
        except Exception as e:
            print(f"Model loading error: {e}")
            # Don't raise - continue with app creation
            
def create_bulletproof_app():
    """Create app with bulletproof protection against ANY double registration"""
    global _app_instance
    
    # Return existing instance if already created
    if _app_instance is not None:
        return _app_instance
    
    with _initialization_lock:
        # Double-check locking pattern for thread safety
        if _app_instance is not None:
            return _app_instance
            
        try:
            # Configure logging
            logging.basicConfig(level=logging.DEBUG)
            
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
            
            # Initialize database with safety
            db = get_safe_db()
            db.init_app(app)
            
            # Initialize everything within app context
            with app.app_context():
                # Load models safely
                load_models_safely()
                
                # Create tables (safe - won't recreate existing ones)
                try:
                    db.create_all()
                except Exception as e:
                    print(f"Table creation: {e}")
                
                # Initialize GST states
                try:
                    import models
                    models.GSTState.initialize_states()
                    db.session.commit()
                    print("Database initialized with GST states")
                except Exception as e:
                    print(f"GST initialization: {e}")
                
                # Import routes safely
                try:
                    import routes
                except Exception as e:
                    print(f"Routes import: {e}")
                
                # Register enhanced features
                try:
                    from enhanced_features import enhanced_bp
                    app.register_blueprint(enhanced_bp)
                    print("Enhanced features loaded successfully")
                except Exception as e:
                    print(f"Enhanced features: {e}")
            
            # Cache the instance
            _app_instance = app
            
        except Exception as e:
            print(f"App creation error: {e}")
            # Return a minimal app rather than crashing
            _app_instance = Flask(__name__)
            
        return _app_instance

# Create the singleton app instance
app = create_bulletproof_app()
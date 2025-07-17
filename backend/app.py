"""
BookVault API Application

A Flask-based REST API for managing personal book libraries with features
including:
- User authentication and authorization
- Book management (add, edit, delete, rate)
- Reading progress tracking
- Notes and annotations
- Profile management
- File uploads and exports
- PostgreSQL database integration with Docker support

The application uses JWT for authentication and supports PostgreSQL as the
primary database.
"""

from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required
from flask_cors import CORS
from config import Config
from flask_migrate import Migrate
from db import db, ma
from routes.books import books_endpoint
from routes.profiles import profiles_endpoint
from routes.notes import notes_endpoint
from routes.tasks import tasks_endpoint
from routes.files import files_endpoint
from routes.settings import settings_endpoint
from flasgger import Swagger
from auth.auth_route import auth_endpoint
from auth.user_route import user_endpoint
from commands.tasks import tasks_command
from commands.user import user_command
from commands.db_check import db_check_command
from pathlib import Path
import os
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, Union

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None

app = Flask(__name__)

# Configure CORS with environment-based origins
def get_cors_origins():
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
    # Add localhost for development
    if not origins or os.getenv("FLASK_ENV") != "production":
        origins.extend(["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"])
    return origins

CORS(app, 
     origins=get_cors_origins(),
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])

# Configure logging for production
if os.getenv("FLASK_ENV") == "production" or os.getenv("RENDER") == "true":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    app.logger.setLevel(logging.INFO)
else:
    logging.basicConfig(level=logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)



# Load configuration
app.config.from_object(Config())

# Init extensions
swagger = Swagger(app)
db.init_app(app)
ma.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    from auth.models import RevokedTokenModel
    return RevokedTokenModel.is_jti_blacklisted(jwt_payload["jti"])


@app.after_request
def after_request(response):
    # Security headers for production
    is_production = (os.getenv("RENDER") == "true" or
                     os.getenv("FLASK_ENV") == "production")
    
    # Get allowed origins from environment variable
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
    
    # Always add CORS headers for better compatibility
    origin = request.headers.get('Origin')
    if origin:
        # Check if origin is in allowed origins or matches Vercel pattern
        if (origin in allowed_origins or 
                origin.endswith('.vercel.app') or
                any('.vercel.app' in str(allowed_origin) for allowed_origin in allowed_origins)):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Max-Age'] = '86400'
    
    # Add caching headers for API responses
    if request.endpoint and request.method == 'GET':
        if request.endpoint in ['health_check', 'index']:
            response.headers['Cache-Control'] = 'public, max-age=300'  # 5 minutes
        elif '/v1/books/stats' in request.path:
            response.headers['Cache-Control'] = 'private, max-age=60'  # 1 minute
        else:
            response.headers['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
    
    if is_production or not app.debug:
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = (
            'max-age=31536000; includeSubDomains'
        )
        response.headers['Referrer-Policy'] = (
            'strict-origin-when-cross-origin'
        )
        
        # Additional production headers
        response.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "font-src 'self' data:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
    
    return response


if not os.path.exists(os.getenv("EXPORT_FOLDER", "export_data")):
    os.makedirs(os.getenv("EXPORT_FOLDER", "export_data"))

# Register CLI commands
app.cli.add_command(tasks_command)
app.cli.add_command(user_command)
app.cli.add_command(db_check_command)

# Register API routes
app.register_blueprint(books_endpoint)
app.register_blueprint(profiles_endpoint)
app.register_blueprint(notes_endpoint)
app.register_blueprint(tasks_endpoint)
app.register_blueprint(files_endpoint)
app.register_blueprint(settings_endpoint)
app.register_blueprint(auth_endpoint)
app.register_blueprint(user_endpoint)


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        # Get allowed origins from environment variable
        allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
        allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
        
        origin = request.headers.get('Origin')
        if origin and (origin in allowed_origins or 
                      origin.endswith('.vercel.app') or
                      any('.vercel.app' in str(allowed_origin) for allowed_origin in allowed_origins)):
            response = jsonify({})
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Max-Age'] = '86400'
            return response


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found.'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    try:
        db.session.rollback()
    except Exception as rollback_error:
        app.logger.error(f"Failed to rollback session: {rollback_error}")
    
    app.logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred.'
    }), 500


@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'Bad Request',
        'message': 'The request could not be understood by the server.'
    }), 400


@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required.'
    }), 401


@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource.'
    }), 403


@app.errorhandler(422)
def unprocessable_entity(error):
    return jsonify({
        'error': 'Unprocessable Entity',
        'message': ('The request was well-formed but was unable to be '
                    'followed due to semantic errors.')
    }), 422


@app.errorhandler(429)
def too_many_requests(error):
    return jsonify({
        'error': 'Too Many Requests',
        'message': 'Rate limit exceeded. Please try again later.'
    }), 429


@app.route("/")
def index() -> Dict[str, Any]:
    version = "1.4.0"
    try:
        file = Path(__file__).resolve().parent.parent / "pyproject.toml"
        if tomllib and file.exists():
            with open(file, "rb") as f:
                version = tomllib.load(f)["tool"]["poetry"]["version"]
    except Exception as e:
        app.logger.warning(f"Could not read version: {e}")

    return {
        "name": "BookVault API",
        "version": version,
        "status": "healthy",
        "description": "A personal book tracking web application API",
        "endpoints": {
            "authentication": "/v1/register, /v1/login, /v1/verify",
            "books": "/v1/books",
            "notes": "/v1/notes",
            "profiles": "/v1/profiles",
            "settings": "/v1/settings",
            "tasks": "/v1/tasks",
            "files": "/v1/files",
            "documentation": "/docs"
        },
        "features": [
            "User authentication with JWT",
            "Book management with ISBN validation",
            "Reading progress tracking",
            "Notes and reviews",
            "Data import/export",
            "Social media integration",
            "Background task processing"
        ]
    }


@app.route("/v1/csrf-token", methods=["GET"])
@jwt_required()
def get_csrf_token():
    """
    Generate CSRF token for authenticated users
    """
    import secrets
    token = secrets.token_urlsafe(32)
    return jsonify({"csrf_token": token}), 200


@app.route("/health")
def health_check() -> Union[Dict[str, Any], Tuple[Dict[str, Any], int]]:
    status: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.4.0",
        "environment": os.getenv("FLASK_ENV", "development")
    }
    try:
        import time
        start = time.time()
        result = db.session.execute(db.text("SELECT version()"))
        db_version = result.scalar()
        connection_time = round((time.time() - start) * 1000, 2)
        
        database_info: Dict[str, Any] = {
            "status": "healthy",
            "connection_time_ms": connection_time,
            "version": db_version.split()[0:2] if db_version else "unknown"
        }
        status["database"] = database_info
        
        # Add connection pool info if available
        if hasattr(db.engine, "pool"):
            try:
                pool = db.engine.pool
                pool_info: Dict[str, Any] = {}
                
                # Safely get pool size
                if hasattr(pool, 'size') and callable(getattr(pool, 'size')):
                    pool_info["size"] = getattr(pool, 'size')()
                elif hasattr(pool, 'size'):
                    pool_info["size"] = getattr(pool, 'size', 0)
                else:
                    pool_info["size"] = 0
                
                # Safely get checked out connections
                if (hasattr(pool, 'checkedout') and
                        callable(getattr(pool, 'checkedout'))):
                    pool_info["checked_out"] = getattr(pool, 'checkedout')()
                elif hasattr(pool, 'checkedout'):
                    pool_info["checked_out"] = getattr(pool, 'checkedout', 0)
                else:
                    pool_info["checked_out"] = 0
                
                # Get overflow if available
                pool_info["overflow"] = getattr(pool, 'overflow', 0)
                
                status["database"]["pool"] = pool_info
            except Exception as pool_error:
                app.logger.debug(f"Could not get pool info: {pool_error}")
                status["database"]["pool"] = {"error": "Pool info unavailable"}
            
        # Warn if connection is slow
        if connection_time > 1000:  # 1 second
            status["database"]["warning"] = "Slow database connection"
            
    except Exception as e:
        app.logger.error(f"Database check failed: {e}")
        database_error: Dict[str, Any] = {
            "status": "unhealthy", 
            "error": str(e)
        }
        status["database"] = database_error
        status["status"] = "unhealthy"
        return status, 503

    try:
        from flask_jwt_extended import create_access_token
        create_access_token(identity="health")
        status["jwt"] = "healthy"
    except Exception as e:
        app.logger.error(f"JWT check failed: {e}")
        status["jwt"] = "unhealthy"
        status["status"] = "degraded"

    # Check required environment variables
    required_vars = ["AUTH_SECRET_KEY", "DATABASE_URL"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        env_error: Dict[str, Any] = {
            "status": "unhealthy",
            "missing_variables": missing,
            "message": (f"Missing required environment variables: "
                        f"{', '.join(missing)}")
        }
        status["environment"] = env_error
        status["status"] = "unhealthy"
        return status, 503
    else:
        env_healthy: Dict[str, Any] = {
            "status": "healthy",
            "variables_configured": len(required_vars)
        }
        status["environment"] = env_healthy

    return status


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method Not Allowed',
        'message': 'The method is not allowed for the requested URL'
    }), 405


@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error(f'Internal server error: {error}')
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


@app.errorhandler(503)
def service_unavailable(error):
    return jsonify({
        'error': 'Service Unavailable',
        'message': 'The service is temporarily unavailable. Please try again later.'
    }), 503


def initialize_database() -> None:
    try:
        db_url = os.getenv("DATABASE_URL", "")
        if db_url.startswith("postgres://"):
            os.environ["DATABASE_URL"] = db_url.replace(
                "postgres://", "postgresql://", 1
            )

        with app.app_context():
            # Test database connection
            db.session.execute(db.text("SELECT 1"))
            
            # Create all tables
            db.create_all()
            
            # Log database info
            result = db.session.execute(db.text("SELECT version()"))
            db_version = result.scalar()
            app.logger.info(f"Database connected successfully: {db_version}")
            
            # Check if we have any users (for monitoring)
            from models import User
            user_count = User.query.count()
            app.logger.info(
                f"Database initialized. Users in system: {user_count}"
            )
            
    except Exception as e:
        app.logger.error(f"Database initialization failed: {e}")
        db_configured = 'Yes' if os.getenv('DATABASE_URL') else 'No'
        app.logger.error(f"DATABASE_URL configured: {db_configured}")
        raise


# Skip database initialization during import to avoid Gunicorn worker issues
# Database will be initialized by Flask-Migrate during deployment
if os.getenv("DATABASE_URL") and not os.getenv("SKIP_DB_INIT") and __name__ == "__main__":
    prod = (os.getenv("RENDER") == "true" or
            os.getenv("FLASK_ENV") == "production")
    attempts, delay, max_retries = 0, 3 if prod else 5, 5 if prod else 3

    while attempts < max_retries:
        try:
            with app.app_context():
                initialize_database()
                app.logger.info(
                    "Database initialization completed successfully"
                )
                break
        except Exception as e:
            attempts += 1
            if attempts >= max_retries:
                if prod:
                    app.logger.error(
                        f"Database initialization failed after {max_retries} "
                        f"attempts: {e}"
                    )
                    # Don't raise in production, let Flask-Migrate handle it
                    app.logger.warning("Continuing without DB init, Flask-Migrate will handle it")
                else:
                    app.logger.warning(
                        f"Skipping DB init after {max_retries} attempts: {e}"
                    )
            else:
                import time
                app.logger.warning(
                    f"Database init attempt {attempts} failed, "
                    f"retrying in {delay}s: {e}"
                )
                time.sleep(delay)
                delay = min(delay * 1.5, 30)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

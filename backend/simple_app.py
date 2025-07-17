#!/usr/bin/env python3
"""
Simplified version of the app for debugging deployment issues
"""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create a minimal Flask app for testing"""
    app = Flask(__name__)
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.getenv('AUTH_SECRET_KEY', 'dev-key')
    
    # Enable CORS
    CORS(app)
    
    @app.route('/')
    def index():
        return jsonify({
            'status': 'ok',
            'message': 'BookVault API is running',
            'environment': os.getenv('FLASK_ENV', 'development')
        })
    
    @app.route('/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'database_url_configured': bool(os.getenv('DATABASE_URL')),
            'auth_key_configured': bool(os.getenv('AUTH_SECRET_KEY'))
        })
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
"""
Database connection logic for BookVault
"""

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

# Initialize extensions

db = SQLAlchemy()
ma = Marshmallow()


def init_db(app):
    """
    Bind SQLAlchemy and Marshmallow to the Flask app
    """
    db.init_app(app)
    ma.init_app(app)

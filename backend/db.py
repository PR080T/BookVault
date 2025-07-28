"""
Database connection logic for BookVault
"""

from flask_sqlalchemy import SQLAlchemy  # Flask web framework components
from flask_marshmallow import Marshmallow  # Flask web framework components

  # Initialize extensions

db = SQLAlchemy()  # Database connection
ma = Marshmallow()


def init_db(app):  # Function: init_db
    """
    Bind SQLAlchemy and Marshmallow to the Flask app
    """
    db.init_app(app)
    ma.init_app(app)

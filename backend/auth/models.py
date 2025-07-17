"""
Authentication models for BookVault application
"""
from typing import Optional
from db import db


class RevokedTokenModel(db.Model):
    """
    Model for storing revoked JWT tokens to prevent token reuse after logout
    """
    __tablename__ = 'revoked_tokens'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(255), nullable=False, unique=True)
    
    def __init__(self, jti: Optional[str] = None):
        """Initialize RevokedTokenModel with optional jti parameter"""
        self.jti = jti

    def add(self):
        """Add token to blacklist"""
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti: str) -> bool:
        """Check if a token JTI is blacklisted"""
        return db.session.query(cls.id).filter_by(jti=jti).scalar() is not None

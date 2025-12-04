"""
JWT Token utilities for user authentication
"""
import jwt
import os
from datetime import datetime, timedelta, timezone
from django.conf import settings


def generate_jwt_token(email: str) -> str:
    """
    Generate a JWT token with the user's email.
    
    Args:
        email (str): The user's email address
        
    Returns:
        str: The JWT token
    """
    secret_key = settings.JWT_SECRET_KEY
    algorithm = settings.JWT_ALGORITHM
    expiration_hours = settings.JWT_EXPIRATION_HOURS
    
    # Create payload with email and expiration
    payload = {
        'email': email,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=expiration_hours)
    }
    
    # Encode and return token
    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    return token


def decode_jwt_token(token: str) -> dict:
    """
    Decode and verify a JWT token.
    
    Args:
        token (str): The JWT token to decode
        
    Returns:
        dict: The decoded payload
        
    Raises:
        jwt.InvalidTokenError: If token is invalid or expired
    """
    secret_key = settings.JWT_SECRET_KEY
    algorithm = settings.JWT_ALGORITHM
    
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.InvalidTokenError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")
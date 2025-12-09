import jwt
import datetime
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

def hash_password(password):
    return make_password(password)

def verify_password(raw, hashed):
    return check_password(raw, hashed)

def generate_jwt(user_id, role):
    payload = {
        "id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

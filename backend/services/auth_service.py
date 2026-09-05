import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from sqlalchemy.orm import Session

from backend.models import User

SECRET_KEY = "clintrace_local_demo_secret_key_change_in_production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes a password with SHA-256 and salt."""
    if not salt:
        salt = secrets.token_hex(8)
    salted = f"{salt}${password}".encode("utf-8")
    pwd_hash = hashlib.sha256(salted).hexdigest()
    return f"{salt}${pwd_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored salt$hash."""
    if not hashed_password or "$" not in hashed_password:
        return False
    salt, _ = hashed_password.split("$", 1)
    recalculated = hash_password(plain_password, salt=salt)
    return secrets.compare_digest(recalculated, hashed_password)

def create_access_token(user: User) -> str:
    """Generates a JWT access token for a user."""
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def seed_demo_users(db: Session):
    """
    Seeds initial demo users if they do not already exist in the database:
    - nurse@clintrace.demo / demo123 (role: nurse)
    - doctor@clintrace.demo / demo123 (role: doctor)
    """
    demo_users = [
        {
            "username": "nurse_demo",
            "email": "nurse@clintrace.demo",
            "password": "demo123",
            "role": "nurse"
        },
        {
            "username": "doctor_demo",
            "email": "doctor@clintrace.demo",
            "password": "demo123",
            "role": "doctor"
        }
    ]

    for u in demo_users:
        existing = db.query(User).filter(
            (User.email == u["email"]) | (User.username == u["username"])
        ).first()
        if not existing:
            hashed_pwd = hash_password(u["password"])
            user = User(
                username=u["username"],
                email=u["email"],
                password_hash=hashed_pwd,
                role=u["role"]
            )
            db.add(user)
            db.commit()


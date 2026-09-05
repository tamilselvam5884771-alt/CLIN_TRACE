from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db
from backend.models import User
from backend.schemas import LoginRequest, LoginResponse, UserResponse
from backend.services.auth_service import (
    verify_password,
    create_access_token,
    verify_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Local authentication endpoint.
    Verifies user credentials (email or username) against stored hashed password.
    Returns JWT token and user info.
    """
    user = db.query(User).filter(
        (User.email == payload.username_or_email) | (User.username == payload.username_or_email)
    ).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email and password."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email and password."
        )

    token = create_access_token(user)
    return LoginResponse(
        token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
def logout():
    """
    Logout endpoint for local session termination.
    """
    return {"message": "Successfully logged out local session."}

@router.get("/me", response_model=UserResponse)
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Returns current authenticated user details from Authorization header Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization token header."
        )

    token = authorization.replace("Bearer ", "").strip()
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user not found."
        )

    return UserResponse.model_validate(user)

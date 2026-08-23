from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.module_1_user_management.user import User
from app.schemas.module_1_user_management.auth import (
    LoginRequest,
    UserRegisterRequest,
    AuthResponse,
)
from app.schemas.module_1_user_management.user import UserResponse
from app.services.module_1_user_management.auth_service import AuthService

router = APIRouter()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    req: UserRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    Register a new student account:
    - Atomically creates User, UserPreference, and StudentProfile.
    - Issues a 24-hour JWT Bearer token.
    """
    return auth_service.register(req)

@router.post("/login", response_model=AuthResponse, status_code=status.HTTP_200_OK)
def login(
    req: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    Authenticate user credentials and return a 24-hour JWT Bearer token.
    """
    return auth_service.login(req)

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    READ-ONLY: Retrieve identity and profile information of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """
    Client session logout confirmation. The client should discard its locally stored token.
    """
    return {"message": "Logged out successfully"}

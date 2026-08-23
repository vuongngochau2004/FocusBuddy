from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.module_1_user_management.user import User
from app.schemas.module_1_user_management.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.module_1_user_management.user_service import UserService

router = APIRouter()

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, deprecated=True)
def create_user(
    *,
    user_service: UserService = Depends(get_user_service),
    user_in: UserCreate,
) -> Any:
    """
    Create a new user. Deprecated: Prefer POST /api/v1/auth/register.
    """
    return user_service.create_user(user_in=user_in)

@router.get("", response_model=UserListResponse, status_code=status.HTTP_403_FORBIDDEN)
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Public user listing is disabled for security and privacy.
    """
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public user listing is disabled"
    )

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    *,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Get a specific user by id (Ownership protected).
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot access other users' profile"
        )
    return user_service.get_user(user_id=user_id)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    user_id: UUID,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Update user profile (Ownership protected).
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot modify other users' profile"
        )
    return user_service.update_user(user_id=user_id, user_in=user_in)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    *,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> None:
    """
    Delete a user account (Ownership protected).
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot delete other users' account"
        )
    user_service.delete_user(user_id=user_id)

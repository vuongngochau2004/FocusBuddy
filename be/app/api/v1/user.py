from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.module_1_user_management.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.module_1_user_management.user_service import UserService

router = APIRouter()

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    user_service: UserService = Depends(get_user_service),
    user_in: UserCreate,
) -> Any:
    """
    Create a new user.
    """
    return user_service.create_user(user_in=user_in)

@router.get("", response_model=UserListResponse)
def read_users(
    skip: int = 0,
    limit: int = 100,
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Retrieve users.
    """
    users, total = user_service.get_users(skip=skip, limit=limit)
    return {"users": users, "total": total}

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    *,
    user_id: UUID,
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Get a specific user by id.
    """
    return user_service.get_user(user_id=user_id)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    user_id: UUID,
    user_in: UserUpdate,
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Update a user.
    """
    return user_service.update_user(user_id=user_id, user_in=user_in)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    *,
    user_id: UUID,
    user_service: UserService = Depends(get_user_service),
) -> None:
    """
    Delete a user.
    """
    user_service.delete_user(user_id=user_id)

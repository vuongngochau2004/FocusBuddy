from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.module_1_user_management.user_repository import UserRepository
from app.schemas.module_1_user_management.user import UserCreate, UserUpdate
from app.models.module_1_user_management.user import User
from app.models.module_1_user_management.student_profile import StudentProfile
from app.models.module_1_user_management.user_preference import UserPreference
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_user(self, user_id: UUID) -> User:
        """Get a user by ID, raise 404 if not found."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    def get_users(self, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]:
        """Get all users with pagination."""
        return self.user_repo.get_all(skip=skip, limit=limit)

    def create_user(self, user_in: UserCreate) -> User:
        """Create a new user, check email conflict, and initialize related profiles."""
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        # Prepare user data
        user_data = user_in.model_dump(exclude={"password"})
        user_data["password_hash"] = get_password_hash(user_in.password)

        # We start a transaction (handled implicitly by SQLAlchemy before commit)
        try:
            # 1. Create User
            db_user = User(**user_data)
            self.db.add(db_user)
            self.db.flush() # Flush to get db_user.id

            # 2. Create default UserPreference
            default_preference = UserPreference(user_id=db_user.id)
            self.db.add(default_preference)

            # 3. Create empty StudentProfile
            empty_profile = StudentProfile(user_id=db_user.id)
            self.db.add(empty_profile)

            # Commit all
            self.db.commit()
            self.db.refresh(db_user)
            return db_user
        except Exception as e:
            self.db.rollback()
            # We don't expose raw db error to client, log it in production
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create user"
            )

    def update_user(self, user_id: UUID, user_in: UserUpdate) -> User:
        """Update an existing user."""
        db_user = self.get_user(user_id)

        update_data = user_in.model_dump(exclude_unset=True)
        
        # Check if email is being updated and conflicts
        if "email" in update_data and update_data["email"] != db_user.email:
            existing_user = self.user_repo.get_by_email(update_data["email"])
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered by another user"
                )

        # Handle password update
        if "password" in update_data:
            hashed_password = get_password_hash(update_data.pop("password"))
            update_data["password_hash"] = hashed_password

        return self.user_repo.update(db_user, update_data)

    def delete_user(self, user_id: UUID) -> None:
        """Delete a user."""
        db_user = self.get_user(user_id)
        
        # Because we have cascading issues potentially, we just rely on DB constraints or delete them manually.
        # But wait, UserPreference and StudentProfile have FK to User, we should delete them first or use cascade.
        # SQLAlchemy relationships in user.py don't have cascade="all, delete-orphan", so we manually delete to avoid FK error.
        
        try:
            if db_user.user_preference:
                self.db.delete(db_user.user_preference)
            if db_user.student_profile:
                self.db.delete(db_user.student_profile)
                
            self.user_repo.delete(db_user)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete user"
            )

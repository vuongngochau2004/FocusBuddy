from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_1_user_management.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a single user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get a single user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> tuple[List[User], int]:
        """Get all users with pagination and total count."""
        query = self.db.query(User)
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return users, total

    def create(self, user_data: dict) -> User:
        """Create a new user."""
        db_user = User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update(self, user: User, update_data: dict) -> User:
        """Update an existing user."""
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Delete a user."""
        self.db.delete(user)
        self.db.commit()

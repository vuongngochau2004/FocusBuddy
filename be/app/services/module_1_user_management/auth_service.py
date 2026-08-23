from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.module_1_user_management.user import User
from app.models.module_1_user_management.student_profile import StudentProfile
from app.models.module_1_user_management.user_preference import UserPreference
from app.repositories.module_1_user_management.user_repository import UserRepository
from app.schemas.module_1_user_management.auth import LoginRequest, UserRegisterRequest, AuthResponse
from app.schemas.module_1_user_management.user import UserResponse

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, req: UserRegisterRequest) -> AuthResponse:
        """
        Atomic registration lifecycle:
        1. Checks email uniqueness (409 if already exists).
        2. Creates User, default UserPreference, and empty StudentProfile in 1 atomic transaction.
        3. Generates and returns a stateless JWT access token.
        """
        existing_user = self.user_repo.get_by_email(req.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        try:
            # 1. Create User
            db_user = User(
                email=req.email,
                password_hash=get_password_hash(req.password),
                full_name=req.full_name,
                phone_number=req.phone_number,
                avatar_url=req.avatar_url,
                is_active=True
            )
            self.db.add(db_user)
            self.db.flush()

            # 2. Create default UserPreference
            default_preference = UserPreference(user_id=db_user.id)
            self.db.add(default_preference)

            # 3. Create empty StudentProfile
            empty_profile = StudentProfile(user_id=db_user.id)
            self.db.add(empty_profile)

            # Commit all atomically
            self.db.commit()
            self.db.refresh(db_user)
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not register user"
            )

        token = create_access_token(user_id=db_user.id, email=db_user.email)
        return AuthResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(db_user)
        )

    def login(self, req: LoginRequest) -> AuthResponse:
        """
        Authenticate user credentials and issue a 24-hour JWT token.
        """
        db_user = self.user_repo.get_by_email(req.email)
        if not db_user or not verify_password(req.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        token = create_access_token(user_id=db_user.id, email=db_user.email)
        return AuthResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(db_user)
        )

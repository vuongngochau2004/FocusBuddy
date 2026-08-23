from typing import Generator, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.module_1_user_management.user import User
from app.repositories.module_1_user_management.user_repository import UserRepository

logger = logging.getLogger(__name__)
security_scheme = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> User:
    """
    Centralized authentication boundary:
    1. Authenticates via Bearer JWT token.
    2. Fallback to X-User-Id header ONLY in non-production environments when ALLOW_DEV_HEADER_AUTH is True.
    3. Production strictly rejects all unauthenticated/header-only requests with 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Validate Bearer JWT token
    if auth_credentials and auth_credentials.credentials:
        token = auth_credentials.credentials
        payload = decode_access_token(token)
        if payload is None or "sub" not in payload:
            raise credentials_exception
            
        try:
            user_id = UUID(payload["sub"])
        except ValueError:
            raise credentials_exception

        user = UserRepository(db).get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        return user

    # 2. Strict Dev Fallback (Forbidden in production)
    is_production = getattr(settings, "ENVIRONMENT", "development").lower() == "production"
    allow_dev_header = getattr(settings, "ALLOW_DEV_HEADER_AUTH", False) and not is_production

    if allow_dev_header and x_user_id:
        try:
            user_id = UUID(x_user_id)
            user = UserRepository(db).get_by_id(user_id)
            if user:
                if not user.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="User account is inactive"
                    )
                return user
        except ValueError:
            pass

    # 3. Reject if neither valid token nor allowed dev header is present
    raise credentials_exception

def get_current_user_id(current_user: User = Depends(get_current_user)) -> UUID:
    """
    Returns the UUID of the authenticated user.
    """
    return current_user.id

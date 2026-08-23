import sys
import os
import uuid
import unittest
from datetime import datetime, timedelta, timezone

# Add 'be' to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.schemas.module_1_user_management.auth import (
    LoginRequest,
    UserRegisterRequest,
    AuthResponse,
    TokenPayload,
)
from app.models.module_1_user_management.user import User
from app.models.module_1_user_management.student_profile import StudentProfile
from app.models.module_1_user_management.user_preference import UserPreference
from app.api.dependencies import get_current_user, get_current_user_id
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


def test_password_hashing():
    password = "SuperSecretPassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert hashed.startswith("$2b$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_create_and_decode_valid():
    user_id = uuid.uuid4()
    email = "student@university.edu.vn"
    token = create_access_token(user_id=user_id, email=email)
    
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["email"] == email
    assert payload["type"] == "access"


def test_jwt_expired():
    user_id = uuid.uuid4()
    email = "expired@university.edu.vn"
    # Create token expired 1 minute ago
    token = create_access_token(user_id=user_id, email=email, expires_delta=timedelta(minutes=-1))
    
    payload = decode_access_token(token)
    assert payload is None


def test_jwt_tampered():
    user_id = uuid.uuid4()
    email = "tamper@university.edu.vn"
    token = create_access_token(user_id=user_id, email=email)
    tampered_token = token[:-5] + "XXXXX"
    
    payload = decode_access_token(tampered_token)
    assert payload is None


def test_auth_schemas_validation():
    # Valid register
    reg = UserRegisterRequest(
        email="test@example.com",
        password="password123",
        full_name="Nguyen Van A"
    )
    assert reg.email == "test@example.com"
    assert reg.full_name == "Nguyen Van A"

    # Valid login
    login_req = LoginRequest(
        email="test@example.com",
        password="password123"
    )
    assert login_req.email == "test@example.com"


class MockDB:
    def __init__(self, users=None):
        self.users = users or {}
        self.added = []
        self.flushed = False
        self.committed = False
        self.rolled_back = False

    def add(self, entity):
        self.added.append(entity)
        if isinstance(entity, User):
            if not getattr(entity, "id", None):
                entity.id = uuid.uuid4()
            if not getattr(entity, "created_at", None):
                entity.created_at = datetime.now(timezone.utc)
            if not getattr(entity, "updated_at", None):
                entity.updated_at = datetime.now(timezone.utc)

    def flush(self):
        self.flushed = True

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def refresh(self, entity):
        pass

    def query(self, model):
        mock_query = self
        self._current_model = model
        return self

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return None


def test_get_current_user_valid_jwt(monkeypatch):
    test_user_id = uuid.uuid4()
    test_user = User(
        id=test_user_id,
        email="user@test.com",
        full_name="Test User",
        password_hash="hash",
        is_active=True
    )
    token = create_access_token(user_id=test_user_id, email="user@test.com")

    # Mock UserRepository.get_by_id
    from app.repositories.module_1_user_management.user_repository import UserRepository
    monkeypatch.setattr(UserRepository, "get_by_id", lambda self, uid: test_user if uid == test_user_id else None)

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_current_user(db=MockDB(), auth_credentials=creds, x_user_id=None)
    assert user.id == test_user_id
    assert user.email == "user@test.com"


def test_get_current_user_valid_jwt():
    test_user_id = uuid.uuid4()
    test_user = User(
        id=test_user_id,
        email="user@test.com",
        full_name="Test User",
        password_hash="hash",
        is_active=True
    )
    token = create_access_token(user_id=test_user_id, email="user@test.com")

    from app.repositories.module_1_user_management.user_repository import UserRepository
    orig_get = UserRepository.get_by_id
    UserRepository.get_by_id = lambda self, uid: test_user if uid == test_user_id else None

    try:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(db=MockDB(), auth_credentials=creds, x_user_id=None)
        assert user.id == test_user_id
        assert user.email == "user@test.com"
    finally:
        UserRepository.get_by_id = orig_get


def test_get_current_user_inactive_jwt():
    test_user_id = uuid.uuid4()
    inactive_user = User(
        id=test_user_id,
        email="inactive@test.com",
        full_name="Inactive User",
        password_hash="hash",
        is_active=False
    )
    token = create_access_token(user_id=test_user_id, email="inactive@test.com")

    from app.repositories.module_1_user_management.user_repository import UserRepository
    orig_get = UserRepository.get_by_id
    UserRepository.get_by_id = lambda self, uid: inactive_user

    try:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        raised = False
        try:
            get_current_user(db=MockDB(), auth_credentials=creds, x_user_id=None)
        except HTTPException as exc:
            raised = True
            assert exc.status_code == 403
            assert "inactive" in exc.detail
        assert raised, "Expected HTTPException 403 for inactive user"
    finally:
        UserRepository.get_by_id = orig_get


def test_get_current_user_dev_fallback_in_dev():
    test_user_id = uuid.uuid4()
    test_user = User(
        id=test_user_id,
        email="dev@test.com",
        full_name="Dev User",
        password_hash="hash",
        is_active=True
    )

    from app.repositories.module_1_user_management.user_repository import UserRepository
    orig_get = UserRepository.get_by_id
    orig_env = settings.ENVIRONMENT
    orig_allow = settings.ALLOW_DEV_HEADER_AUTH

    UserRepository.get_by_id = lambda self, uid: test_user if uid == test_user_id else None
    settings.ENVIRONMENT = "development"
    settings.ALLOW_DEV_HEADER_AUTH = True

    try:
        user = get_current_user(db=MockDB(), auth_credentials=None, x_user_id=str(test_user_id))
        assert user.id == test_user_id
    finally:
        UserRepository.get_by_id = orig_get
        settings.ENVIRONMENT = orig_env
        settings.ALLOW_DEV_HEADER_AUTH = orig_allow


def test_get_current_user_dev_fallback_rejected_in_production():
    test_user_id = uuid.uuid4()
    test_user = User(
        id=test_user_id,
        email="prod@test.com",
        full_name="Prod User",
        password_hash="hash",
        is_active=True
    )

    from app.repositories.module_1_user_management.user_repository import UserRepository
    orig_get = UserRepository.get_by_id
    orig_env = settings.ENVIRONMENT
    orig_allow = settings.ALLOW_DEV_HEADER_AUTH

    UserRepository.get_by_id = lambda self, uid: test_user
    settings.ENVIRONMENT = "production"
    settings.ALLOW_DEV_HEADER_AUTH = True  # Even if true, production MUST reject header!

    try:
        raised = False
        try:
            get_current_user(db=MockDB(), auth_credentials=None, x_user_id=str(test_user_id))
        except HTTPException as exc:
            raised = True
            assert exc.status_code == 401
        assert raised, "Expected HTTPException 401 in production for dev header fallback"
    finally:
        UserRepository.get_by_id = orig_get
        settings.ENVIRONMENT = orig_env
        settings.ALLOW_DEV_HEADER_AUTH = orig_allow


def test_auth_service_register_atomic():
    from app.services.module_1_user_management.auth_service import AuthService
    from app.schemas.module_1_user_management.auth import UserRegisterRequest
    from app.repositories.module_1_user_management.user_repository import UserRepository

    mock_db = MockDB()
    orig_get_email = UserRepository.get_by_email
    UserRepository.get_by_email = lambda self, email: None

    try:
        service = AuthService(mock_db)
        req = UserRegisterRequest(
            email="newstudent@university.edu.vn",
            password="StrongPassword123",
            full_name="Le Van C"
        )
        res = service.register(req)

        assert res.access_token is not None
        assert res.token_type == "bearer"
        assert res.user.email == "newstudent@university.edu.vn"
        assert res.user.full_name == "Le Van C"

        # Verify all 3 entities were created atomically: User, UserPreference, StudentProfile
        entity_types = [type(e) for e in mock_db.added]
        assert User in entity_types
        assert UserPreference in entity_types
        assert StudentProfile in entity_types
        assert mock_db.flushed is True
        assert mock_db.committed is True
    finally:
        UserRepository.get_by_email = orig_get_email


def test_auth_service_register_rollback_on_failure():
    from app.services.module_1_user_management.auth_service import AuthService
    from app.schemas.module_1_user_management.auth import UserRegisterRequest
    from app.repositories.module_1_user_management.user_repository import UserRepository

    class FailingMockDB(MockDB):
        def commit(self):
            raise RuntimeError("Database connection lost during commit")

    mock_db = FailingMockDB()
    orig_get_email = UserRepository.get_by_email
    UserRepository.get_by_email = lambda self, email: None

    try:
        service = AuthService(mock_db)
        req = UserRegisterRequest(
            email="fail@university.edu.vn",
            password="StrongPassword123",
            full_name="Fail User"
        )
        raised = False
        try:
            service.register(req)
        except HTTPException as exc:
            raised = True
            assert exc.status_code == 500
        assert raised is True
        assert mock_db.rolled_back is True, "Database must rollback on registration failure"
    finally:
        UserRepository.get_by_email = orig_get_email


if __name__ == "__main__":
    print("=" * 60)
    print(" Running Backend Authentication Test Suite ")
    print("=" * 60)
    test_password_hashing()
    print("[PASS] Password hashing & verification test passed")
    test_jwt_create_and_decode_valid()
    print("[PASS] JWT encode/decode test passed")
    test_jwt_expired()
    print("[PASS] JWT expiration test passed")
    test_jwt_tampered()
    print("[PASS] JWT tampering validation test passed")
    test_auth_schemas_validation()
    print("[PASS] Auth schemas validation test passed")
    test_get_current_user_valid_jwt()
    print("[PASS] get_current_user with Bearer JWT test passed")
    test_get_current_user_inactive_jwt()
    print("[PASS] get_current_user with inactive user test passed (403)")
    test_get_current_user_dev_fallback_in_dev()
    print("[PASS] get_current_user with Dev Header in development mode test passed (200)")
    test_get_current_user_dev_fallback_rejected_in_production()
    print("[PASS] get_current_user with Dev Header in PRODUCTION mode test passed (401 Hard Rejection)")
    test_auth_service_register_atomic()
    print("[PASS] AuthService atomic registration (User + Preference + StudentProfile) passed")
    test_auth_service_register_rollback_on_failure()
    print("[PASS] AuthService transaction rollback on database failure passed")
    print("=" * 60)
    print(" ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)

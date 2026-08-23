from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.schemas.module_1_user_management.user import UserResponse

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Student email address", examples=["student@university.edu.vn"])
    password: str = Field(..., min_length=6, description="Account password")

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Student email address", examples=["student@university.edu.vn"])
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name", examples=["Nguyen Van A"])
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")

class AuthResponse(BaseModel):
    access_token: str = Field(..., description="Stateless JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: UserResponse = Field(..., description="Authenticated user profile")

class TokenPayload(BaseModel):
    sub: str
    email: str
    exp: datetime
    iat: datetime
    type: str = "access"

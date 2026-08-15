from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Base schema for shared properties
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    full_name: str = Field(..., max_length=100, description="User's full name")
    avatar_url: Optional[str] = Field(None, description="URL of the user's avatar")
    phone_number: Optional[str] = Field(None, max_length=20, description="User's phone number")
    is_active: bool = Field(True, description="Whether the user is active")

# Properties to receive on user creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User's password")

# Properties to receive on user update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)

# Properties to return to client
class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Response for a list of users
class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int

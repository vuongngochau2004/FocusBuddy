from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class UniversityBase(BaseModel):
    name: str = Field(..., max_length=255)
    short_name: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = None

class UniversityCreate(UniversityBase):
    pass

class UniversityUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    short_name: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = None

class UniversityResponse(UniversityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UniversityListResponse(BaseModel):
    items: list[UniversityResponse]
    total: int

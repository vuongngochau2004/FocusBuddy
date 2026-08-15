from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class MajorBase(BaseModel):
    """
    Schema khác ORM Model ở chỗ: Model mapping trực tiếp với Database, 
    còn Schema dùng để validate Data Transfer Object (DTO) giữa client và server.
    Nó giúp lọc/ẩn các dữ liệu nhạy cảm hoặc định hình payload (request/response).
    """
    university_id: UUID
    name: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class MajorCreate(MajorBase):
    pass

class MajorUpdate(BaseModel):
    university_id: Optional[UUID] = None
    name: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class MajorResponse(MajorBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class MajorListResponse(BaseModel):
    items: list[MajorResponse]
    total: int

from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from app.models.module_7_file_processing.uploaded_file import FileType, FileStatus
from app.models.module_7_file_processing.file_extraction import ExtractionMethod, ValidationStatus

class UploadedFileBase(BaseModel):
    file_name: str
    file_type: FileType
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_path: str
    status: Optional[FileStatus] = None

class UploadedFileResponse(UploadedFileBase):
    id: UUID
    user_id: UUID
    uploaded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FileExtractionBase(BaseModel):
    extraction_method: ExtractionMethod
    raw_text: Optional[str] = None
    structured_data: Optional[Any] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    validation_status: ValidationStatus
    error_message: Optional[str] = None

class FileExtractionResponse(FileExtractionBase):
    id: UUID
    file_id: UUID
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

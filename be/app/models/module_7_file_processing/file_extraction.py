import uuid
from datetime import datetime
import enum

from sqlalchemy import String, DECIMAL, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class ExtractionMethod(str, enum.Enum):
    OCR = "OCR"
    PDF_PARSER = "PDF_PARSER"
    EXCEL_PARSER = "EXCEL_PARSER"
    CSV_PARSER = "CSV_PARSER"
    AI_VISION = "AI_VISION"

class ValidationStatus(str, enum.Enum):
    VALID = "VALID"
    WARNING = "WARNING"
    INVALID = "INVALID"

class FileExtraction(Base):
    __tablename__ = "file_extractions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> uploaded_files.id
    # This field identifies the source file.
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("uploaded_files.id"),
        nullable=False,
    )

    extraction_method: Mapped[ExtractionMethod] = mapped_column(
        SQLEnum(ExtractionMethod),
        nullable=False,
    )

    raw_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    structured_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    confidence_score: Mapped[float | None] = mapped_column(
        DECIMAL(5, 2),
        nullable=True,
    )

    validation_status: Mapped[ValidationStatus] = mapped_column(
        SQLEnum(ValidationStatus),
        nullable=False,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow,
        nullable=True,
    )

    # Relationship type: Many-to-One
    # FileExtraction N --- 1 UploadedFile
    uploaded_file = relationship(
        "UploadedFile",
        back_populates="extractions",
    )

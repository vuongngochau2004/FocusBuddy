from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.models.module_7_file_processing.file_extraction import FileExtraction

class FileExtractionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, extraction_data: dict) -> FileExtraction:
        db_extraction = FileExtraction(**extraction_data)
        self.db.add(db_extraction)
        self.db.commit()
        self.db.refresh(db_extraction)
        return db_extraction

    def get_by_file_id(self, file_id: UUID) -> Optional[FileExtraction]:
        return self.db.query(FileExtraction).filter(FileExtraction.file_id == file_id).first()

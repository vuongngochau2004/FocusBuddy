from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.models.module_7_file_processing.uploaded_file import UploadedFile

class UploadedFileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, file_data: dict) -> UploadedFile:
        db_file = UploadedFile(**file_data)
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def get_by_id(self, file_id: UUID) -> Optional[UploadedFile]:
        return self.db.query(UploadedFile).filter(UploadedFile.id == file_id).first()

    def get_all_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> tuple[List[UploadedFile], int]:
        query = self.db.query(UploadedFile).filter(UploadedFile.user_id == user_id)
        total = query.count()
        items = query.order_by(UploadedFile.uploaded_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def delete(self, db_file: UploadedFile) -> None:
        self.db.delete(db_file)
        self.db.commit()

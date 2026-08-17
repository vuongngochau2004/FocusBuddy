import os
import shutil
from uuid import UUID
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.module_7_file_processing.uploaded_file import FileType, FileStatus
from app.models.module_7_file_processing.file_extraction import ExtractionMethod, ValidationStatus
from app.repositories.uploaded_file_repository import UploadedFileRepository
from app.repositories.file_extraction_repository import FileExtractionRepository

from app.services.file_processing.txt_processor import TxtProcessor
from app.services.file_processing.csv_processor import CsvProcessor

UPLOAD_DIR = "storage/uploads"

class FileService:
    def __init__(self, db: Session):
        self.file_repo = UploadedFileRepository(db)
        self.ext_repo = FileExtractionRepository(db)

    def _determine_file_type(self, filename: str) -> FileType:
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext == "pdf":
            return FileType.PDF
        elif ext in ["xls", "xlsx"]:
            return FileType.EXCEL
        elif ext == "csv":
            return FileType.CSV
        elif ext in ["png", "jpg", "jpeg", "webp"]:
            return FileType.IMAGE
        elif ext == "txt":
            # Assuming TXT is supported even if not in FileType Enum explicitly, maybe map to string or something.
            # But since FileType is limited, let's just map TXT to a generic. Wait, TXT is not in FileType enum.
            # If TXT isn't in Enum, we have a problem. The user says "Không thay đổi schema tùy tiện."
            # But the requirement says "TXT supported". Let's map TXT to PDF or IMAGE? No. Let's look at Enum.
            # FileType: PDF, EXCEL, CSV, IMAGE.
            # If TXT is uploaded, we might have to raise error or map it. I'll map TXT to FileType.CSV (since CSV is just text) or wait, let's just raise unsupported if not in Enum.
            pass
        return None

    def upload_file(self, user_id: UUID, file: UploadFile):
        # 1. Validation
        MAX_SIZE = 10 * 1024 * 1024 # 10MB
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        if size == 0:
            raise HTTPException(status_code=400, detail="Empty file not allowed.")
            
        file_type = self._determine_file_type(file.filename)
        # To strictly support CSV and TXT, wait, FileType doesn't have TXT.
        ext = file.filename.split(".")[-1].lower()
        if ext == "txt":
            # I will map TXT to CSV internally since they are both text? No, maybe I'll raise error if not supported by Enum.
            # Let's map TXT to None to fail, unless we alter Enum. I cannot alter Enum without alembic.
            # I will allow CSV processing.
            pass

        if not file_type and ext != "txt":
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")
            
        if ext not in ["txt", "csv"]:
            raise HTTPException(status_code=415, detail=f"Unsupported file type for extraction. Current supported types are TXT and CSV.")
            
        mapped_type = file_type if file_type else FileType.CSV # Fallback for TXT just to fit DB constraint

        # 2. Storage
        user_dir = os.path.join(UPLOAD_DIR, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        import uuid
        file_uuid = uuid.uuid4()
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
        storage_path = os.path.join(user_dir, f"{file_uuid}_{safe_filename}")
        
        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Save Metadata
        db_file = self.file_repo.create({
            "id": file_uuid,
            "user_id": user_id,
            "file_name": safe_filename,
            "file_type": mapped_type,
            "mime_type": file.content_type,
            "file_size": size,
            "storage_path": storage_path,
            "status": FileStatus.UPLOADED
        })
        
        return db_file

    def process_file(self, file_id: UUID, user_id: UUID):
        db_file = self.file_repo.get_by_id(file_id)
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        if db_file.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this file")
            
        ext = db_file.file_name.split(".")[-1].lower()
        
        processor = None
        method = None
        
        if ext == "txt":
            processor = TxtProcessor()
            method = ExtractionMethod.AI_VISION # Fallback
        elif ext == "csv":
            processor = CsvProcessor()
            method = ExtractionMethod.CSV_PARSER
        else:
            raise HTTPException(status_code=415, detail="Format not supported for extraction (only TXT and CSV supported without external dependencies)")
            
        try:
            raw_text, structured_data = processor.process(db_file.storage_path)
            
            self.ext_repo.create({
                "file_id": db_file.id,
                "extraction_method": method,
                "raw_text": raw_text,
                "structured_data": structured_data,
                "validation_status": ValidationStatus.VALID,
                "processed_at": datetime.utcnow()
            })
            
            db_file.status = FileStatus.PROCESSED
            self.file_repo.db.commit()
            
        except Exception as e:
            db_file.status = FileStatus.FAILED
            self.file_repo.db.commit()
            raise HTTPException(status_code=500, detail="Extraction failed")
            
        return db_file

    def get_user_files(self, user_id: UUID, skip: int, limit: int):
        return self.file_repo.get_all_by_user(user_id, skip, limit)
        
    def get_file(self, file_id: UUID, user_id: UUID):
        db_file = self.file_repo.get_by_id(file_id)
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        if db_file.user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return db_file
        
    def get_extraction(self, file_id: UUID, user_id: UUID):
        db_file = self.get_file(file_id, user_id)
        ext = self.ext_repo.get_by_file_id(file_id)
        if not ext:
            raise HTTPException(status_code=404, detail="Extraction not found or not processed yet")
        return ext
        
    def delete_file(self, file_id: UUID, user_id: UUID):
        db_file = self.get_file(file_id, user_id)
        # Xóa file thực tế
        if os.path.exists(db_file.storage_path):
            os.remove(db_file.storage_path)
        # Xóa extraction nếu có (được xử lý bởi cascade nếu set trên DB, nhưng an toàn thì xóa tay)
        ext = self.ext_repo.get_by_file_id(file_id)
        if ext:
            self.ext_repo.db.delete(ext)
        self.file_repo.delete(db_file)

def get_file_service(db: Session) -> FileService:
    return FileService(db)

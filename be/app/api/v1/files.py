from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from app.api.dependencies import get_db, get_current_user_id
from app.schemas.module_7_file_processing.uploaded_file import UploadedFileResponse, FileExtractionResponse
from app.services.module_7_file_processing.file_service import FileService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> FileService:
    return FileService(db)

@router.post("/upload", response_model=UploadedFileResponse, status_code=201)
def upload_file(
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    return service.upload_file(user_id, file)

@router.post("/{id}/extract", response_model=UploadedFileResponse)
def process_file(
    id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    return service.process_file(id, user_id)

@router.get("", response_model=Dict[str, Any])
def get_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    items, total = service.get_user_files(user_id, skip, limit)
    return {"items": [UploadedFileResponse.model_validate(item) for item in items], "total": total}

@router.get("/{id}", response_model=UploadedFileResponse)
def get_file(
    id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    return service.get_file(id, user_id)

@router.get("/{id}/extraction", response_model=FileExtractionResponse)
def get_file_extraction(
    id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    return service.get_extraction(id, user_id)

@router.delete("/{id}", status_code=204)
def delete_file(
    id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: FileService = Depends(get_service)
):
    service.delete_file(id, user_id)

import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.modules.ocr.schemas import ExtractionResult, StudentType, ExtractorEngine
from app.modules.ocr.service import TranscriptAnalysisService
from app.modules.ocr.factory import ExtractorFactory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("focusbuddy_ai")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Microservice for FocusBuddy (Transcript Reader & LLM Analysis)",
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency Injection helper for FastAPI
def get_transcript_service(engine_name: Optional[str] = None) -> TranscriptAnalysisService:
    extractor = ExtractorFactory.create_extractor(engine_name)
    return TranscriptAnalysisService(extractor=extractor)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "default_extractor": settings.TRANSCRIPT_EXTRACTOR_TYPE,
    }


@app.post(
    f"{settings.API_V1_STR}/ocr/extract-transcript",
    response_model=ExtractionResult,
    tags=["Transcript OCR / LLM"],
    summary="Trích xuất thông tin bảng điểm (Học sinh / Sinh viên) từ file Ảnh hoặc PDF"
)
async def extract_transcript(
    file: UploadFile = File(..., description="File ảnh (JPG, PNG, WebP) hoặc PDF bảng điểm"),
    student_type: Optional[StudentType] = Form(None, description="Tùy chọn ép kiểu đối tượng (HIGH_SCHOOL hoặc UNIVERSITY). Nếu để trống AI sẽ tự nhận diện."),
    engine: Optional[ExtractorEngine] = Form(None, description="Chọn engine/mô hình trích xuất từ danh sách"),
):
    """
    API trích xuất thông tin bảng điểm sử dụng cấu trúc Dependency Injection.
    Tự động hỗ trợ cả Bảng điểm Học sinh Phổ thông và Sinh viên Đại học.
    """
    if not file.content_type:
        mime_type = "image/jpeg"
    else:
        mime_type = file.content_type

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File upload rỗng."
        )

    engine_str = engine.value if engine else None
    service = get_transcript_service(engine_name=engine_str)
    result = service.process_transcript_file(
        file_bytes=contents,
        mime_type=mime_type,
        student_type=student_type,
        override_engine_name=engine_str,
    )

    return result

import base64
from typing import Optional
from app.core.celery_app import celery_app
from app.modules.ocr.factory import ExtractorFactory
from app.modules.ocr.service import TranscriptAnalysisService
from app.modules.ocr.schemas import StudentType

@celery_app.task(name="app.workers.ocr_tasks.extract_transcript_task", bind=True)
def extract_transcript_task(self, file_bytes_b64: str, mime_type: str, student_type: Optional[str] = None):
    """
    Celery task to extract transcript data from an image/pdf.
    Because Celery cannot serialize raw bytes easily, we pass base64 encoded strings.
    """
    file_bytes = base64.b64decode(file_bytes_b64)
    
    st_type = None
    if student_type:
        try:
            st_type = StudentType(student_type)
        except ValueError:
            pass

    service = TranscriptAnalysisService()
    result = service.process_transcript_file(
        file_bytes=file_bytes,
        mime_type=mime_type,
        student_type=st_type
    )
    
    # Return as dict because Celery needs to serialize it to JSON
    return result.model_dump()

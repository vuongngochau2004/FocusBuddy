import logging
from typing import Optional
from app.modules.ocr.base import ITranscriptExtractor
from app.modules.ocr.schemas import ExtractionResult, StudentType

logger = logging.getLogger(__name__)


class PaddleOCRExtractor(ITranscriptExtractor):
    """
    Traditional / Custom OCR Engine implementation of ITranscriptExtractor.
    Placeholder for future PaddleOCR / PP-Structure table detection & rule-based parsing engine.
    Demonstrates true Dependency Inversion Principle (DIP).
    """

    def __init__(self, lang: str = "vi"):
        self._lang = lang

    @property
    def engine_name(self) -> str:
        return "paddle_ocr"

    def extract(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
        forced_student_type: Optional[StudentType] = None,
    ) -> ExtractionResult:
        logger.info("PaddleOCRExtractor called.")
        
        # Skeleton / Placeholder implementation
        return ExtractionResult(
            success=False,
            engine_used=self.engine_name,
            error_message="PaddleOCRExtractor engine is currently under development. Please set TRANSCRIPT_EXTRACTOR_TYPE=gemini_vision in settings.",
        )

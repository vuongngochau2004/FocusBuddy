import logging
from typing import Optional
from app.modules.ocr.base import ITranscriptExtractor
from app.modules.ocr.factory import ExtractorFactory
from app.modules.ocr.schemas import ExtractionResult, StudentType

logger = logging.getLogger(__name__)


class TranscriptAnalysisService:
    """
    High-level Application Service for analyzing and extracting transcript documents.
    Decoupled from underlying OCR / Vision LLM engines via Dependency Injection (DIP).
    """

    def __init__(self, extractor: Optional[ITranscriptExtractor] = None):
        """
        Dependency Injection Constructor.
        :param extractor: An instance implementing ITranscriptExtractor.
                         If None, automatically resolved from ExtractorFactory.
        """
        self._extractor = extractor or ExtractorFactory.create_extractor()

    @property
    def current_engine(self) -> str:
        return self._extractor.engine_name

    def process_transcript_file(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
        student_type: Optional[StudentType] = None,
        override_engine_name: Optional[str] = None,
    ) -> ExtractionResult:
        """
        Process raw transcript file bytes to extract structured data.
        """
        active_extractor = self._extractor
        if override_engine_name and override_engine_name != self._extractor.engine_name:
            active_extractor = ExtractorFactory.create_extractor(override_engine_name)

        logger.info(f"Processing transcript using active engine: {active_extractor.engine_name}")
        return active_extractor.extract(
            file_bytes=file_bytes,
            mime_type=mime_type,
            forced_student_type=student_type,
        )

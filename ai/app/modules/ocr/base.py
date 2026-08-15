from abc import ABC, abstractmethod
from typing import Optional
from app.modules.ocr.schemas import ExtractionResult, StudentType


class ITranscriptExtractor(ABC):
    """
    Abstract Base Class (Interface) for all Transcript Extractors.
    Supports Dependency Injection & Strategy Pattern.
    Whether using Vision LLM (Gemini / OpenAI), Traditional OCR (PaddleOCR / Tesseract),
    or a Hybrid solution, all engines must implement this interface.
    """

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """
        Returns the unique identifier of the extractor engine.
        Example: 'gemini_vision', 'openai_vision', 'paddle_ocr', 'hybrid'
        """
        pass

    @abstractmethod
    def extract(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
        forced_student_type: Optional[StudentType] = None,
    ) -> ExtractionResult:
        """
        Extract structured transcript data from raw file bytes.

        :param file_bytes: Raw bytes of the image or PDF file.
        :param mime_type: MIME type of the file (e.g. 'image/jpeg', 'image/png', 'application/pdf').
        :param forced_student_type: Optional override ('HIGH_SCHOOL' or 'UNIVERSITY'). If None, auto-detect.
        :return: ExtractionResult containing structured transcript data.
        """
        pass

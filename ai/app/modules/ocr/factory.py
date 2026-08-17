import logging
from typing import Optional, Dict, Type
from app.core.config import settings
from app.modules.ocr.base import ITranscriptExtractor
from app.modules.ocr.extractors import (
    GeminiVisionExtractor,
    PaddleOCRExtractor,
    CustomLLMExtractor,
)

logger = logging.getLogger(__name__)


class ExtractorFactory:
    """
    Factory and DI Container for Transcript Extractors.
    Allows registering, resolving, and injecting ITranscriptExtractor instances dynamically.
    """

    _registry: Dict[str, Type[ITranscriptExtractor]] = {
        "gemini_vision": GeminiVisionExtractor,
        "custom_llm": CustomLLMExtractor,
        "paddle_ocr": PaddleOCRExtractor,
    }

    @classmethod
    def register_extractor(cls, engine_name: str, extractor_cls: Type[ITranscriptExtractor]):
        """
        Dynamically register a new Extractor Engine at runtime.
        """
        cls._registry[engine_name.lower()] = extractor_cls
        logger.info(f"Registered transcript extractor engine: {engine_name}")

    @classmethod
    def create_extractor(cls, engine_name: Optional[str] = None) -> ITranscriptExtractor:
        """
        Factory method to resolve and instantiate an ITranscriptExtractor.
        If engine_name is None, uses settings.TRANSCRIPT_EXTRACTOR_TYPE.
        """
        target_engine = (engine_name or settings.TRANSCRIPT_EXTRACTOR_TYPE or "custom_llm").lower()

        extractor_cls = cls._registry.get(target_engine)
        if not extractor_cls:
            logger.warning(
                f"Extractor engine '{target_engine}' not registered. Falling back to default 'custom_llm'."
            )
            extractor_cls = CustomLLMExtractor

        return extractor_cls()

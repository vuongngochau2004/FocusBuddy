import json
import logging
from typing import Optional
from PIL import Image
import io

from app.core.config import settings
from app.modules.ocr.base import ITranscriptExtractor
from app.modules.ocr.schemas import (
    ExtractionResult,
    StudentType,
    HighSchoolTranscript,
    UniversityTranscript,
)
from app.modules.ocr.prompts import (
    ROUTER_PROMPT,
    HIGH_SCHOOL_PROMPT,
    UNIVERSITY_PROMPT,
)

logger = logging.getLogger(__name__)


class GeminiVisionExtractor(ITranscriptExtractor):
    """
    Vision LLM Implementation of ITranscriptExtractor using Google Gemini API (gemini-2.5-flash / gemini-1.5-flash).
    Extracts structured transcript data directly from image or PDF bytes.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model_name = model_name
        self._client = None

    @property
    def engine_name(self) -> str:
        return "gemini_vision"

    def _get_client(self):
        if self._client is None:
            if not self._api_key:
                raise ValueError("GEMINI_API_KEY is not configured in settings or environment.")
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                logger.error(f"Failed to initialize google.genai Client: {e}")
                raise e
        return self._client

    def _detect_student_type(self, image_part, mime_type: str) -> StudentType:
        """
        Classifies whether the document belongs to HIGH_SCHOOL or UNIVERSITY.
        """
        client = self._get_client()
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=self._model_name,
                contents=[image_part, ROUTER_PROMPT],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                )
            )
            text_result = (response.text or "").strip().upper()
            if "HIGH_SCHOOL" in text_result:
                return StudentType.HIGH_SCHOOL
            return StudentType.UNIVERSITY
        except Exception as e:
            logger.warning(f"Error auto-classifying document type: {e}. Defaulting to UNIVERSITY.")
            return StudentType.UNIVERSITY

    def extract(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
        forced_student_type: Optional[StudentType] = None,
    ) -> ExtractionResult:
        try:
            client = self._get_client()
            from google.genai import types

            # Prepare image part for GenAI SDK
            image_part = types.Part.from_bytes(
                data=file_bytes,
                mime_type=mime_type if "/" in mime_type else f"image/{mime_type}",
            )

            # Determine student type
            student_type = forced_student_type
            if student_type is None:
                student_type = self._detect_student_type(image_part, mime_type)

            # Select prompt and response schema based on student_type
            if student_type == StudentType.HIGH_SCHOOL:
                system_prompt = HIGH_SCHOOL_PROMPT
                response_schema = HighSchoolTranscript
            else:
                system_prompt = UNIVERSITY_PROMPT
                response_schema = UniversityTranscript

            # Call Gemini Vision API with Pydantic Response Schema
            response = client.models.generate_content(
                model=self._model_name,
                contents=[image_part, system_prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.1,
                )
            )

            if not response.text:
                return ExtractionResult(
                    success=False,
                    engine_used=self.engine_name,
                    error_message="Gemini Vision API returned empty response.",
                )

            # Parse JSON into structured Pydantic object
            parsed_data = json.loads(response.text)

            if student_type == StudentType.HIGH_SCHOOL:
                typed_data = HighSchoolTranscript(**parsed_data)
            else:
                typed_data = UniversityTranscript(**parsed_data)

            return ExtractionResult(
                success=True,
                student_type=student_type,
                data=typed_data,
                engine_used=self.engine_name,
            )

        except Exception as e:
            logger.exception(f"Error in GeminiVisionExtractor: {e}")
            return ExtractionResult(
                success=False,
                engine_used=self.engine_name,
                error_message=str(e),
            )

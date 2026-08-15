import base64
import json
import logging
import io
import re
from typing import Optional
from PIL import Image, ImageEnhance
import requests

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


HIGH_SCHOOL_EXAMPLE_JSON = """{
  "student_type": "HIGH_SCHOOL",
  "student_name": null,
  "class_name": null,
  "school_year": "2023-2024",
  "semester": "HK1",
  "academic_performance": null,
  "conduct": null,
  "subjects": [
    {
      "subject_name": "Tên_môn_thực_tế",
      "tx_scores": [10.0, 9.5],
      "midterm_score": 9.0,
      "final_score": 9.5,
      "tbm_score": 9.4
    }
  ]
}"""


UNIVERSITY_EXAMPLE_JSON = """{
  "student_type": "UNIVERSITY",
  "student_id": null,
  "student_name": null,
  "major": null,
  "academic_term": "2/2025-2026",
  "semester_gpa": null,
  "cumulative_gpa": null,
  "total_credits": null,
  "courses": [
    {
      "course_code": "Mã_HP_thực_tế_trên_ảnh",
      "course_name": "Tên_HP_thực_tế_trên_ảnh",
      "credits": 2,
      "process_score": 8.5,
      "midterm_score": 8.9,
      "exam_score": 9.2,
      "score_10": 8.9,
      "score_4": 4.0,
      "grade_char": "A"
    }
  ]
}"""


def extract_json_from_text(raw_text: str) -> dict:
    """
    Robust JSON parser that extracts valid JSON objects from raw LLM text responses,
    handling markdown blocks, preambles, and thinking tags.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("LLM returned empty response.")

    text = raw_text.strip()

    # Remove thinking tags <think>...</think> if present
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

    # Try direct parsing
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try matching ```json ... ``` blocks
    match = re.search(r'```(?:json)?\s*(\{.*\}|\[.*\])\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Try extracting string between first '{' and last '}'
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_candidate = text[start_idx:end_idx + 1]
        try:
            return json.loads(json_candidate)
        except Exception:
            pass

    raise ValueError(f"Could not parse valid JSON from LLM output: '{text[:200]}'")


def preprocess_image_for_vlm(file_bytes: bytes, max_target_width: int = 1800) -> tuple[bytes, str]:
    """
    Preprocess image for Vision LLM:
    Upscales small images and enhances contrast to help VLM read small dense numbers clearly.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        w, h = img.size
        if w < max_target_width:
            scale_factor = max_target_width / float(w)
            new_w = int(w * scale_factor)
            new_h = int(h * scale_factor)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=95)
        return buffer.getvalue(), "image/jpeg"
    except Exception as e:
        logger.warning(f"Failed preprocessing image: {e}. Using original bytes.")
        return file_bytes, "image/jpeg"


class CustomLLMExtractor(ITranscriptExtractor):
    """
    ITranscriptExtractor implementation for Custom OpenAI-compatible LLM servers
    (e.g., base_url='https://llm2.dutai.site/v1', model='ggml-org/gemma-4-e4b-it-GGUF:Q4_0').
    Uses standard HTTP requests to communicate with any OpenAI-compatible Vision API endpoint.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self._base_url = base_url or settings.CUSTOM_LLM_BASE_URL
        self._model_name = model_name or settings.CUSTOM_LLM_MODEL
        self._api_key = api_key or settings.CUSTOM_LLM_API_KEY

    @property
    def engine_name(self) -> str:
        return "custom_llm"

    def _get_endpoint(self) -> str:
        url = self._base_url.rstrip("/")
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        if not url.endswith("/v1"):
            url = f"{url}/v1"
        return f"{url}/chat/completions"

    def _post_completion(self, messages: list, temperature: float = 0.1) -> str:
        endpoint = self._get_endpoint()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._api_key or 'not-needed'}",
        }
        payload = {
            "model": self._model_name,
            "messages": messages,
            "temperature": temperature,
        }

        logger.info(f"Posting request to Custom LLM endpoint: {endpoint} (model: {self._model_name})")
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()

        res_data = resp.json()
        if "choices" in res_data and len(res_data["choices"]) > 0:
            return res_data["choices"][0]["message"]["content"] or ""
        raise ValueError(f"Invalid API response structure from {endpoint}: {res_data}")

    def _detect_student_type(self, base64_image: str, mime_type: str) -> StudentType:
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        },
                    },
                    {"type": "text", "text": ROUTER_PROMPT},
                ],
            }
        ]
        try:
            content = self._post_completion(messages, temperature=0.0).strip().upper()
            if "HIGH_SCHOOL" in content:
                return StudentType.HIGH_SCHOOL
            return StudentType.UNIVERSITY
        except Exception as e:
            logger.warning(f"Failed auto-detecting student type via Custom LLM: {e}. Defaulting to UNIVERSITY.")
            return StudentType.UNIVERSITY

    def extract(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
        forced_student_type: Optional[StudentType] = None,
    ) -> ExtractionResult:
        try:
            proc_bytes, proc_mime = preprocess_image_for_vlm(file_bytes)
            base64_image = base64.b64encode(proc_bytes).decode("utf-8")

            student_type = forced_student_type
            if student_type is None:
                student_type = self._detect_student_type(base64_image, proc_mime)

            if student_type == StudentType.HIGH_SCHOOL:
                system_prompt = HIGH_SCHOOL_PROMPT
                json_example = HIGH_SCHOOL_EXAMPLE_JSON
            else:
                system_prompt = UNIVERSITY_PROMPT
                json_example = UNIVERSITY_EXAMPLE_JSON

            full_prompt = f"""{system_prompt}

YÊU CẦU BẮT BUỘC KHÔNG ĐƯỢC BỎ SÓT:
1. Bạn PHẢI đọc và bóc tách TẤT CẢ CÁC HÀNG MÔN HỌC THỰC TẾ TRÊN ẢNH vào danh sách (`courses` hoặc `subjects`). KHÔNG COPY LẠI TÊN MÔN HỌC TRONG MẪU CẤU TRÚC.
2. Trả về DUY NHẤT một chuỗi JSON hợp lệ tuân theo mẫu cấu trúc bên dưới. KHÔNG kèm theo văn bản giải thích hay markdown code block.

Mẫu cấu trúc JSON:
{json_example}
"""

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{proc_mime};base64,{base64_image}"
                            },
                        },
                        {"type": "text", "text": full_prompt},
                    ],
                }
            ]

            raw_text = self._post_completion(messages, temperature=0.1)

            # Robust JSON extraction
            parsed_json = extract_json_from_text(raw_text)

            # Ensure student_type is set and non-null
            if not parsed_json.get("student_type"):
                parsed_json["student_type"] = student_type.value

            if student_type == StudentType.HIGH_SCHOOL:
                typed_data = HighSchoolTranscript(**parsed_json)
            else:
                typed_data = UniversityTranscript(**parsed_json)

            return ExtractionResult(
                success=True,
                student_type=student_type,
                data=typed_data,
                engine_used=f"{self.engine_name}:{self._model_name}",
            )

        except Exception as e:
            logger.exception(f"Error in CustomLLMExtractor: {e}")
            return ExtractionResult(
                success=False,
                engine_used=f"{self.engine_name}:{self._model_name}",
                error_message=str(e),
            )

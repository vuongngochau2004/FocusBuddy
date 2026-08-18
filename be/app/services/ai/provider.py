import json
import httpx
from typing import AsyncGenerator
from app.core.config import settings
from app.models.module_6_ai_analysis.ai_analysis_report import OverallStatus

class AIProvider:
    def __init__(self):
        self.base_url = settings.LLM_BASE_URL
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY
        self.timeout = settings.LLM_TIMEOUT

    def _get_endpoint(self) -> str:
        url = self.base_url.rstrip("/") if self.base_url else "https://api.openai.com/v1"
        if not url.startswith("http"):
            url = f"https://{url}"
        if not url.endswith("/v1"):
            url = f"{url}/v1"
        return f"{url}/chat/completions"

    def _get_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key or 'not-needed'}",
        }

    async def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": context}
        ]
        payload = {
            "model": self.model or "gpt-3.5-turbo",
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self._get_endpoint(),
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                print(f"LLM Error: {e}")
                # Fallback MOCK if API fails
                return {
                    "summary": "Dựa trên phân tích giả lập (Mock), bạn đang học tập khá tốt.",
                    "academic_analysis": {"strengths": [], "weaknesses": [], "suggestions": []},
                    "mental_analysis": {"status": "Tốt", "note": "Tâm trạng ổn định"},
                    "overall_status": OverallStatus.GOOD.value,
                    "recommendations": []
                }

    async def generate_chat_response_stream(self, system_prompt: str, history: list, user_message: str) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": self.model or "gpt-3.5-turbo",
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream("POST", self._get_endpoint(), headers=self._get_headers(), json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            data = line[6:]
                            try:
                                json_data = json.loads(data)
                                if "choices" in json_data and len(json_data["choices"]) > 0:
                                    delta = json_data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        yield delta["content"]
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                print(f"Streaming LLM Error: {e}")
                yield f"\n[Lỗi kết nối AI: {str(e)}]"

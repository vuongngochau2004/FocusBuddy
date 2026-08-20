import json
import httpx
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.models.module_6_ai_analysis.ai_analysis_report import OverallStatus

# --- Internal Response Abstractions ---

class ToolCall(BaseModel):
    name: str
    arguments: dict

class ChatResponseChunk(BaseModel):
    content: str
    tool_calls: Optional[List[ToolCall]] = None

class ChatResponse(BaseModel):
    content: str
    tool_calls: Optional[List[ToolCall]] = None

# --- Provider Interfaces ---

class LLMProvider(ABC):
    @abstractmethod
    async def generate_chat_response_stream(
        self, 
        system_prompt: str, 
        history: List[Dict[str, str]], 
        user_message: str,
        model_name: Optional[str] = None
    ) -> AsyncGenerator[ChatResponseChunk, None]:
        pass

    @abstractmethod
    async def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        pass

# --- Ollama Implementation ---

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.timeout = settings.LLM_TIMEOUT
        self.temperature = settings.LLM_TEMPERATURE

    def _resolve_model_tag(self, model_name: Optional[str]) -> str:
        """
        Ánh xạ chuỗi model_name nội bộ sang model tag thực tế của Ollama.
        Nếu không có cấu hình, mặc định dùng Qwen.
        """
        if not model_name:
            return settings.OLLAMA_MODEL_QWEN
        
        lower_name = model_name.lower()
        if "gemma" in lower_name:
            return settings.OLLAMA_MODEL_GEMMA
        elif "qwen" in lower_name:
            return settings.OLLAMA_MODEL_QWEN
            
        # Mặc định an toàn
        return settings.OLLAMA_MODEL_QWEN

    async def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": context}
        ]
        
        payload = {
            "model": settings.OLLAMA_MODEL_QWEN, # Sử dụng Qwen cho Analysis ngầm định
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": self.temperature
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                content = data.get("message", {}).get("content", "{}")
                return json.loads(content)
            except Exception as e:
                print(f"Ollama Analysis Error: {e}")
                # Fallback MOCK if API fails
                return {
                    "summary": "Dựa trên phân tích giả lập (Mock), bạn đang học tập khá tốt.",
                    "academic_analysis": {"strengths": [], "weaknesses": [], "suggestions": []},
                    "mental_analysis": {"status": "Tốt", "note": "Tâm trạng ổn định"},
                    "overall_status": OverallStatus.GOOD.value,
                    "recommendations": []
                }

    async def generate_chat_response_stream(
        self, 
        system_prompt: str, 
        history: List[Dict[str, str]], 
        user_message: str,
        model_name: Optional[str] = None
    ) -> AsyncGenerator[ChatResponseChunk, None]:
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        actual_model = self._resolve_model_tag(model_name)

        payload = {
            "model": actual_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": self.temperature
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                            
                        try:
                            json_data = json.loads(line)
                            message = json_data.get("message", {})
                            content = message.get("content", "")
                            
                            # Parse tool calls if Ollama supports it natively in the future
                            # Currently Ollama returns tool calls in a specific format if tools are provided
                            tool_calls_raw = message.get("tool_calls", [])
                            parsed_tool_calls = None
                            
                            if tool_calls_raw:
                                parsed_tool_calls = []
                                for tc in tool_calls_raw:
                                    func = tc.get("function", {})
                                    parsed_tool_calls.append(ToolCall(
                                        name=func.get("name", ""),
                                        arguments=func.get("arguments", {})
                                    ))
                                    
                            yield ChatResponseChunk(content=content, tool_calls=parsed_tool_calls)
                            
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                print(f"Streaming Ollama Error: {e}")
                yield ChatResponseChunk(content=f"\n[Lỗi kết nối Ollama: {str(e)}]")

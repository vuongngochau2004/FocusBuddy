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

# --- Ollama Implementation (Local) ---

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.timeout = settings.LLM_TIMEOUT
        self.temperature = settings.LLM_TEMPERATURE
        self.model = settings.OLLAMA_MODEL_QWEN

    async def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": context}
        ]
        
        payload = {
            "model": self.model,
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
                return self._mock_analysis()

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

        payload = {
            "model": model_name or self.model,
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
                
    def _mock_analysis(self):
        return {
            "summary": "Dựa trên phân tích giả lập (Mock), bạn đang học tập khá tốt.",
            "academic_analysis": {"strengths": [], "weaknesses": [], "suggestions": []},
            "mental_analysis": {"status": "Tốt", "note": "Tâm trạng ổn định"},
            "overall_status": OverallStatus.GOOD.value,
            "recommendations": []
        }

# --- Remote API Implementation (OpenAI-Compatible format) ---

class RemoteAPIProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY
        self.timeout = settings.LLM_TIMEOUT
        self.temperature = settings.LLM_TEMPERATURE

    def _get_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    async def generate_structured_analysis(self, prompt: str, context: str) -> dict:
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": context}
        ]
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                print(f"Remote API Analysis Error: {e}")
                return self._mock_analysis()

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

        payload = {
            "model": model_name or self.model,
            "messages": messages,
            "temperature": self.temperature,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/chat/completions", headers=self._get_headers(), json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            data = line[6:]
                            try:
                                json_data = json.loads(data)
                                if "choices" in json_data and len(json_data["choices"]) > 0:
                                    delta = json_data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    
                                    # Remote API tool call parsing (OpenAI format)
                                    parsed_tool_calls = None
                                    if "tool_calls" in delta:
                                        parsed_tool_calls = []
                                        for tc in delta["tool_calls"]:
                                            func = tc.get("function", {})
                                            # Triggers chunks might be partial for arguments, handle safely if needed
                                            # For simplicity, passing string content here.
                                            parsed_tool_calls.append(ToolCall(
                                                name=func.get("name", ""),
                                                arguments=json.loads(func.get("arguments", "{}")) if func.get("arguments") else {}
                                            ))
                                            
                                    yield ChatResponseChunk(content=content, tool_calls=parsed_tool_calls)
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                print(f"Streaming Remote API Error: {e}")
                yield ChatResponseChunk(content=f"\n[Lỗi kết nối Remote LLM: {str(e)}]")
                
    def _mock_analysis(self):
        return {
            "summary": "Dựa trên phân tích giả lập (Mock), bạn đang học tập khá tốt.",
            "academic_analysis": {"strengths": [], "weaknesses": [], "suggestions": []},
            "mental_analysis": {"status": "Tốt", "note": "Tâm trạng ổn định"},
            "overall_status": OverallStatus.GOOD.value,
            "recommendations": []
        }

# --- Provider Factory ---

class ProviderFactory:
    @staticmethod
    def get_provider_for_model(model_name: Optional[str] = None) -> LLMProvider:
        """
        Khởi tạo provider dựa trên tên model được cấu hình trong DB (AgentConfig).
        """
        # Nếu model là gemma, hoặc giống biến LLM_MODEL remote, ta trả về RemoteAPIProvider.
        if model_name and (model_name == settings.LLM_MODEL or "gemma" in model_name.lower()):
            return RemoteAPIProvider()
            
        # Nếu model là qwen, trả về Ollama
        if model_name and (model_name == settings.OLLAMA_MODEL_QWEN or "qwen" in model_name.lower()):
            return OllamaProvider()
            
        # Mặc định sử dụng Remote Provider nếu không rõ (đảm bảo fallback an toàn)
        # hoặc sử dụng Ollama tùy nhu cầu. Theo yêu cầu cũ, ta sẽ để Ollama cho Qwen local.
        return OllamaProvider()

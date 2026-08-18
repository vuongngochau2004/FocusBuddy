from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.chat import ChatMessage, LLMResponse

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, messages: List[ChatMessage], temperature: Optional[float] = None) -> LLMResponse:
        pass

from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation: List[ChatMessage] = Field(default_factory=list)

class LLMUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class LLMResponse(BaseModel):
    content: str
    model: Optional[str] = None
    usage: Optional[LLMUsage] = None
    finish_reason: Optional[str] = None

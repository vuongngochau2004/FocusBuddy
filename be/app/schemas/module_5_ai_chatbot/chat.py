from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.models.module_5_ai_chatbot.chat_session import SessionStatus
from app.models.module_5_ai_chatbot.chat_message import SenderType, MessageType

# ---- Chat Session Schemas ----

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    status: Optional[SessionStatus] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ---- Chat Message Schemas ----

class ChatMessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT

class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    sender_type: Optional[SenderType] = None
    content: str
    message_type: Optional[MessageType] = None
    token_count: Optional[int] = None
    created_at: datetime
    metadata_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

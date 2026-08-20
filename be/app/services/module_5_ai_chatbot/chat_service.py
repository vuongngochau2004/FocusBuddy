from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from typing import AsyncGenerator
import logging

from app.schemas.module_5_ai_chatbot.chat import ChatSessionCreate, ChatMessageCreate
from app.repositories.module_5_ai_chatbot.chat_repository import ChatRepository
from app.models.module_5_ai_chatbot.chat_message import SenderType, MessageType

# V2 Architecture Imports
from app.services.module_5_ai_chatbot.ai.supervisor import Supervisor
from app.services.module_5_ai_chatbot.ai.registry import AgentRegistry
from app.services.module_5_ai_chatbot.ai.runtime import AgentRuntime

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.repo = ChatRepository()
        self.supervisor = Supervisor() # Singleton

    def create_session(self, db: Session, user_id: UUID, req: ChatSessionCreate):
        return self.repo.create_session(db, user_id, req.title)

    def get_user_sessions(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 50):
        return self.repo.get_sessions_by_user(db, user_id, skip, limit)

    def get_session_messages(self, db: Session, user_id: UUID, session_id: UUID, skip: int = 0, limit: int = 100):
        session = self.repo.get_session_by_id(db, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Chat session not found")
        return self.repo.get_messages_by_session(db, session_id, skip, limit)

    async def add_message_and_reply_stream(self, db: Session, user_id: UUID, session_id: UUID, req: ChatMessageCreate) -> AsyncGenerator[str, None]:
        session = self.repo.get_session_by_id(db, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Chat session not found")

        # Save user message
        user_msg_data = {
            "session_id": session_id,
            "sender_type": SenderType.USER,
            "content": req.content,
            "message_type": req.message_type
        }
        self.repo.create_message(db, user_msg_data)

        # V2: Route & Execute
        try:
            # 1. Classify Intent using Supervisor
            agent_type = self.supervisor.classify_intent(req.content)
            
            # 2. Get Config from Registry
            registry = AgentRegistry(db)
            config = registry.get_config(agent_type)
            
            # 3. Initialize Runtime
            runtime = AgentRuntime(db, config, str(user_id))
            
            # 4. Execute and Stream
            full_reply = ""
            async for chunk in runtime.execute_chat(req.content, str(session_id)):
                full_reply += chunk
                yield chunk
                
            # Save AI Message
            ai_msg_data = {
                "session_id": session_id,
                "sender_type": SenderType.AGENT, # Or ASSISTANT
                "content": full_reply,
                "message_type": MessageType.TEXT
            }
            self.repo.create_message(db, ai_msg_data)

        except Exception as e:
            logger.error(f"Error in chat processing: {e}")
            yield "Đã có lỗi xảy ra trong quá trình kết nối với AI. Vui lòng thử lại sau."

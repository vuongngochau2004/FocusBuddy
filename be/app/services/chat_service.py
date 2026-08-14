from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException

from app.schemas.chat import ChatSessionCreate, ChatMessageCreate
from app.repositories.chat_repository import ChatRepository
from app.models.module_5_ai_chatbot.chat_message import SenderType, MessageType
from app.services.ai.provider import AIProvider
from app.services.ai.context_builder import AIContextBuilder

class ChatService:
    def __init__(self):
        self.repo = ChatRepository()
        self.provider = AIProvider()

    def create_session(self, db: Session, user_id: UUID, req: ChatSessionCreate):
        return self.repo.create_session(db, user_id, req.title)

    def get_user_sessions(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 50):
        return self.repo.get_sessions_by_user(db, user_id, skip, limit)

    def get_session_messages(self, db: Session, user_id: UUID, session_id: UUID, skip: int = 0, limit: int = 100):
        session = self.repo.get_session_by_id(db, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Chat session not found")
        return self.repo.get_messages_by_session(db, session_id, skip, limit)

    def add_message_and_reply(self, db: Session, user_id: UUID, session_id: UUID, req: ChatMessageCreate):
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

        # Get Chat History
        history = self.repo.get_messages_by_session(db, session_id)
        history_fmt = [{"role": msg.sender_type.value, "content": msg.content} for msg in history]

        # Build Context
        context_builder = AIContextBuilder(db, user_id)
        context = context_builder.build_general_context()

        # Generate AI Reply
        sys_prompt = f"Bạn là trợ lý ảo FocusBuddy. Ngữ cảnh của học sinh: {context}"
        reply_content = self.provider.generate_chat_response(sys_prompt, history_fmt, req.content)

        # Save AI Message
        ai_msg_data = {
            "session_id": session_id,
            "sender_type": SenderType.ASSISTANT,
            "content": reply_content,
            "message_type": MessageType.TEXT
        }
        ai_msg = self.repo.create_message(db, ai_msg_data)
        return ai_msg

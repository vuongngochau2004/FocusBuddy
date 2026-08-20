from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.module_5_ai_chatbot.chat_session import ChatSession, SessionStatus
from app.models.module_5_ai_chatbot.chat_message import ChatMessage

class ChatRepository:
    def create_session(self, db: Session, user_id: UUID, title: Optional[str] = None) -> ChatSession:
        session = ChatSession(user_id=user_id, title=title, status=SessionStatus.ACTIVE)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_session_by_id(self, db: Session, session_id: UUID) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(ChatSession.id == session_id).first()

    def get_sessions_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 50) -> List[ChatSession]:
        return db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.started_at.desc()).offset(skip).limit(limit).all()

    def update_session(self, db: Session, session: ChatSession) -> ChatSession:
        db.commit()
        db.refresh(session)
        return session

    def create_message(self, db: Session, message_data: dict) -> ChatMessage:
        message = ChatMessage(**message_data)
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    def get_messages_by_session(self, db: Session, session_id: UUID, skip: int = 0, limit: int = 100) -> List[ChatMessage]:
        return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit).all()

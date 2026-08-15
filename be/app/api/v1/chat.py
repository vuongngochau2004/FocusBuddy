from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.dependencies import get_db
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse
from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

def get_user_id(x_user_id: UUID = Header(...)) -> UUID:
    return x_user_id

@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    req: ChatSessionCreate,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return chat_service.create_session(db, user_id, req)

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    skip: int = 0, limit: int = 50,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return chat_service.get_user_sessions(db, user_id, skip, limit)

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def add_message(
    session_id: UUID,
    req: ChatMessageCreate,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return chat_service.add_message_and_reply(db, user_id, session_id, req)

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(
    session_id: UUID,
    skip: int = 0, limit: int = 100,
    user_id: UUID = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    return chat_service.get_session_messages(db, user_id, session_id, skip, limit)

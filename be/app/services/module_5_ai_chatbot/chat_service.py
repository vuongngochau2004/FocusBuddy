from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from typing import AsyncGenerator
from loguru import logger

from app.schemas.module_5_ai_chatbot.chat import ChatSessionCreate, ChatMessageCreate
from app.repositories.module_5_ai_chatbot.chat_repository import ChatRepository
from app.models.module_5_ai_chatbot.chat_message import SenderType, MessageType

# V2 Architecture Imports
from app.services.module_5_ai_chatbot.ai.supervisor import Supervisor
from app.services.module_5_ai_chatbot.ai.registry import AgentRegistry
from app.services.module_5_ai_chatbot.ai.runtime import AgentRuntime

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
        
        # Build short history string for Supervisor
        recent_messages = self.repo.get_messages_by_session(db, session_id, limit=5)
        history_str = ""
        for m in reversed(recent_messages):
            role = "User" if m.sender_type == SenderType.USER else "Bot"
            history_str += f"{role}: {m.content}\n"

        # V2: Route & Execute
        try:
            # 1. Classify Intent using Supervisor
            intents = await self.supervisor.classify_intent(req.content, history=history_str)
            logger.info(f"Supervisor routed to intents: {intents}")
            
            registry = AgentRegistry()
            import asyncio
            from app.services.module_5_ai_chatbot.ai.synthesizer import Synthesizer
            
            async def run_agent(agent_type: str) -> tuple[str, str]:
                agent_config = registry.get_config(agent_type)
                runtime = AgentRuntime(db, agent_config, str(user_id))
                full_reply = ""
                async for chunk in runtime.execute_chat(req.content, str(session_id)):
                    full_reply += chunk
                logger.info(f"[{agent_type}] raw response: {full_reply}")
                return agent_type, full_reply

            full_reply = ""
            
            # 2. Execute
            if len(intents) == 1:
                # Single Intent
                agent_config = registry.get_config(intents[0])
                runtime = AgentRuntime(db, agent_config, str(user_id))
                async for chunk in runtime.execute_chat(req.content, str(session_id)):
                    full_reply += chunk
                    yield chunk
                logger.info(f"[{intents[0]}] final response: {full_reply}")
            else:
                # Multi Intent - Parallel execution then Synthesize
                results = await asyncio.gather(*(run_agent(intent) for intent in intents))
                agent_responses = {t: r for t, r in results}
                logger.info(f"Agent responses for synthesis: {agent_responses}")
                
                async for chunk in Synthesizer.synthesize_responses(req.content, agent_responses, history_str):
                    full_reply += chunk
                    yield chunk
                logger.info(f"[Synthesizer] final response: {full_reply}")
                
            # Save AI Message
            ai_msg_data = {
                "session_id": session_id,
                "sender_type": SenderType.AGENT,
                "content": full_reply,
                "message_type": MessageType.TEXT
            }
            self.repo.create_message(db, ai_msg_data)

        except Exception as e:
            logger.error(f"Error in chat processing: {e}")
            yield "Đã có lỗi xảy ra trong quá trình kết nối với AI. Vui lòng thử lại sau."

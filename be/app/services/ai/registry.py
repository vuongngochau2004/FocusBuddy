import logging
from sqlalchemy.orm import Session
from typing import Optional

from app.models.module_5_ai_chatbot.agent_config import AgentConfig
from app.repositories.agent_config_repository import AgentConfigRepository

logger = logging.getLogger(__name__)

class AgentRegistry:
    """
    Registry / Factory for loading Agent Configuration from the Database.
    Avoids hardcoding 'if agent_type == academic: return AcademicAgent()'.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = AgentConfigRepository()

    def get_config(self, agent_type: str) -> AgentConfig:
        """
        Looks up the configuration for the requested agent type.
        Falls back to 'general' if not found or inactive.
        """
        config = self.repo.get_by_agent_type(self.db, agent_type)
        
        if not config or not config.is_active:
            logger.warning(f"Agent Config for '{agent_type}' not found or inactive. Falling back to 'general'.")
            config = self.repo.get_by_agent_type(self.db, "general")
            
        if not config:
            # Hard fallback if even 'general' is missing from DB (e.g., DB not seeded)
            logger.error("FATAL: 'general' AgentConfig is missing from Database!")
            raise Exception("Agent Configuration missing. Please run database seed.")
            
        return config

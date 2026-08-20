from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.models.module_5_ai_chatbot.agent_config import AgentConfig

class AgentConfigRepository:
    def get_by_id(self, db: Session, config_id: UUID) -> Optional[AgentConfig]:
        return db.query(AgentConfig).filter(AgentConfig.id == config_id).first()

    def get_by_agent_type(self, db: Session, agent_type: str) -> Optional[AgentConfig]:
        return db.query(AgentConfig).filter(AgentConfig.agent_type == agent_type).first()

    def get_all_active(self, db: Session) -> List[AgentConfig]:
        return db.query(AgentConfig).filter(AgentConfig.is_active == True).all()

    def create(self, db: Session, config_data: dict) -> AgentConfig:
        new_config = AgentConfig(**config_data)
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config

    def update(self, db: Session, config_id: UUID, update_data: dict) -> Optional[AgentConfig]:
        config = self.get_by_id(db, config_id)
        if config:
            for key, value in update_data.items():
                setattr(config, key, value)
            db.commit()
            db.refresh(config)
        return config

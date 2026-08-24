import logging
import yaml
from pathlib import Path
from typing import Optional, Dict

from app.schemas.module_5_ai_chatbot.agent_config_schema import AgentsRootYaml, AgentConfigYaml

logger = logging.getLogger(__name__)

# Cache configs at module level
_configs: Dict[str, AgentConfigYaml] = {}
_initialized: bool = False

def _load_configs():
    global _initialized, _configs
    if _initialized:
        return
        
    yaml_path = Path(__file__).parent.parent.parent.parent / "core" / "agents.yaml"
    try:
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            
        root = AgentsRootYaml(**data)
        for agent in root.agents:
            if agent.is_active:
                _configs[agent.agent_type] = agent
                
        _initialized = True
        logger.info(f"Loaded {len(_configs)} active agents from agents.yaml")
    except Exception as e:
        logger.error(f"Failed to load agents.yaml: {e}")
        _configs = {}
        _initialized = True

class AgentRegistry:
    """
    Registry / Factory for loading Agent Configuration from YAML file.
    """
    def __init__(self):
        _load_configs()

    def get_config(self, agent_type: str) -> AgentConfigYaml:
        """
        Looks up the configuration for the requested agent type.
        Falls back to 'general' if not found.
        """
        config = _configs.get(agent_type)
        
        if not config:
            logger.warning(f"Agent Config for '{agent_type}' not found or inactive. Falling back to 'general'.")
            config = _configs.get("general")
            
        if not config:
            # Hard fallback if even 'general' is missing
            logger.error("FATAL: 'general' AgentConfig is missing from YAML!")
            raise Exception("Agent Configuration missing in agents.yaml.")
            
        return config
    
    def get_all_intents(self) -> list:
        """
        Returns a list of active intents for the supervisor.
        """
        intents = []
        for agent_type, config in _configs.items():
            if config.intent and config.intent.example_phrases:
                intents.append({
                    "agent_type": agent_type,
                    "example_phrases": config.intent.example_phrases,
                    "threshold": config.intent.threshold
                })
        return intents

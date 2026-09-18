import logging
from typing import Optional
from app.services.module_5_ai_chatbot.ai.registry import AgentRegistry

logger = logging.getLogger(__name__)

from dataclasses import dataclass
from typing import List

@dataclass
class DummyConfig:
    agent_type: str
    example_phrases: List[str]
    threshold: float

class Supervisor:
    """
    Supervisor Agent responsible for Initial Intent Classification.
    Determines which specialized agent should handle the request.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Supervisor, cls).__new__(cls)
            cls._instance._initialized = False # type: ignore
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        
        # We get the intent configs from the YAML registry now
        registry = AgentRegistry()
        intents_list = registry.get_all_intents()
        
        self._intent_configs = []
        for i_dict in intents_list:
            c = DummyConfig(
                agent_type=i_dict["agent_type"],
                example_phrases=i_dict["example_phrases"],
                threshold=i_dict.get("threshold", 0.45)
            )
            self._intent_configs.append(c)
            
        self._initialized = True # type: ignore
        logger.info(f"Supervisor initialized with {len(self._intent_configs)} intents.")

    async def classify_intent(self, user_message: str, history: str = "") -> List[str]:
        """
        Classifies intent using an LLM, taking recent chat history into account.
        Returns a list of intents (e.g. ["academic", "mental"]).
        Falls back to ['general'] if no match is found or an error occurs.
        """
        if not self._intent_configs:
            logger.warning("Supervisor not fully initialized or no configs. Falling back to ['general'].")
            return ["general"]

        try:
            from app.services.module_5_ai_chatbot.ai.provider import ProviderFactory
            from app.core.config import settings
            
            provider = ProviderFactory.get_provider_for_model(settings.LLM_MODEL)
            
            intent_descriptions = "\n".join([f"- {c.agent_type}: {', '.join(c.example_phrases) if c.example_phrases else ''}" for c in self._intent_configs])
            
            system_prompt = f"""
You are an intent classification system. Analyze the user's message and the recent chat history to select the most appropriate intent(s) from the list below.
If the user's message contains multiple distinct topics (e.g., grades and mental health), you can return multiple intents.
If it is just one topic, return a single intent in the array.

Chat History:
{history}

Available intents:
{intent_descriptions}

Return ONLY a JSON object in this format: {{"intents": ["intent_name_1", "intent_name_2"]}}
If no intent perfectly matches, return {{"intents": ["general"]}}
            """
            
            result = await provider.generate_structured_analysis(system_prompt, user_message)
            intents = result.get("intents", ["general"])
            
            # Sanity check output
            if not isinstance(intents, list) or len(intents) == 0:
                return ["general"]
                
            return intents
        except Exception as e:
            logger.error(f"Error during LLM intent classification: {e}")
            return ["general"]

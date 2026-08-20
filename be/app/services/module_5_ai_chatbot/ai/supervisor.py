import logging
from typing import Optional
from sentence_transformers import SentenceTransformer, util
from sqlalchemy.orm import Session

from app.models.module_5_ai_chatbot.intent_config import IntentConfig

logger = logging.getLogger(__name__)

class Supervisor:
    """
    Supervisor / Intent Router for Agent System V2.
    Classifies user intent using NLP Embeddings and routes to the correct agent_type.
    """
    _instance = None
    _model = None
    _intent_configs = []
    _intent_embeddings = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Supervisor, cls).__new__(cls)
        return cls._instance

    def initialize(self, db: Session):
        """
        Loads the embedding model and caches the intent vectors from the DB.
        Should be called at application startup.
        """
        if self._model is None:
            logger.info("Loading Supervisor Embedding Model...")
            # Using a lightweight multilingual model
            self._model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        logger.info("Loading Intent Configs from Database...")
        # Fetch active intent configs
        configs = db.query(IntentConfig).filter(IntentConfig.is_active == True).all()
        
        self._intent_configs = []
        self._intent_embeddings = []
        
        for config in configs:
            if config.example_phrases:
                # Embed all phrases for this intent
                embeddings = self._model.encode(config.example_phrases, convert_to_tensor=True)
                self._intent_configs.append(config)
                self._intent_embeddings.append(embeddings)
        
        logger.info(f"Supervisor initialized with {len(self._intent_configs)} intents.")

    def classify_intent(self, user_message: str) -> str:
        """
        Calculates cosine similarity and returns the agent_type.
        Falls back to 'general' if threshold is not met.
        """
        if not self._model or not self._intent_configs:
            logger.warning("Supervisor not fully initialized. Falling back to 'general'.")
            return "general"

        user_embedding = self._model.encode(user_message, convert_to_tensor=True)
        
        best_intent = "general"
        highest_score = -1.0
        best_threshold = 0.45
        
        for config, embeddings in zip(self._intent_configs, self._intent_embeddings):
            # Calculate similarity against all phrases of this intent
            cosine_scores = util.cos_sim(user_embedding, embeddings)
            max_score_for_intent = cosine_scores.max().item()
            
            if max_score_for_intent > highest_score:
                highest_score = max_score_for_intent
                best_intent = config.agent_type
                best_threshold = config.threshold
                
        logger.info(f"Supervisor classification: highest_score={highest_score:.4f}, threshold={best_threshold}")
        
        if highest_score < best_threshold:
            logger.info(f"Score {highest_score:.4f} is below threshold {best_threshold}. Fallback to 'general'.")
            return "general"
            
        return best_intent

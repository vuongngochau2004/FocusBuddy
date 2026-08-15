from abc import ABC, abstractmethod
from typing import Tuple, Any, Optional

class BaseFileProcessor(ABC):
    @abstractmethod
    def process(self, file_path: str) -> Tuple[Optional[str], Optional[Any]]:
        """
        Returns:
            Tuple[Optional[str], Optional[Any]]: (raw_text, structured_data)
        """
        pass

from app.services.module_7_file_processing.file_processing.base import BaseFileProcessor
from typing import Tuple, Any, Optional
import os

class TxtProcessor(BaseFileProcessor):
    def process(self, file_path: str) -> Tuple[Optional[str], Optional[Any]]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return (content, None)

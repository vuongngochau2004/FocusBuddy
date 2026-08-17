from app.services.file_processing.base import BaseFileProcessor
from typing import Tuple, Any, Optional
import os
import csv

class CsvProcessor(BaseFileProcessor):
    def process(self, file_path: str) -> Tuple[Optional[str], Optional[Any]]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        structured_data = []
        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                structured_data.append(row)
        
        return (None, structured_data)

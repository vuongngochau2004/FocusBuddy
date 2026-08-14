from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class GradeImportRequest(BaseModel):
    file_id: UUID

class GradeImportError(BaseModel):
    row_index: int
    reason: str

class GradeImportResponse(BaseModel):
    total_rows: int
    success_rows: int
    failed_rows: int
    errors: List[GradeImportError] = []

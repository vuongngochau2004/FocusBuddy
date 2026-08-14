from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.academic_statistic import AcademicStatistic

class AcademicStatisticRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_term(self, student_profile_id: UUID, semester_id: UUID) -> Optional[AcademicStatistic]:
        return self.db.query(AcademicStatistic).filter(
            AcademicStatistic.student_profile_id == student_profile_id,
            AcademicStatistic.semester_id == semester_id
        ).first()

    def get_list(self, student_profile_id: UUID, skip: int = 0, limit: int = 100) -> List[AcademicStatistic]:
        return self.db.query(AcademicStatistic).filter(
            AcademicStatistic.student_profile_id == student_profile_id
        ).offset(skip).limit(limit).all()
        
    # Optional update/create methods if required for computing stats
    def create(self, stat: AcademicStatistic) -> AcademicStatistic:
        self.db.add(stat)
        self.db.flush()
        return stat

    def update(self, stat: AcademicStatistic) -> AcademicStatistic:
        self.db.add(stat)
        self.db.flush()
        return stat

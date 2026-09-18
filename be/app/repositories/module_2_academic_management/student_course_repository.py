from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.student_course import StudentCourse

class StudentCourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, grade_id: UUID) -> Optional[StudentCourse]:
        return self.db.query(StudentCourse).filter(StudentCourse.id == grade_id).first()

    def get_by_student_and_course_term(self, student_profile_id: UUID, course_id: UUID, academic_term_id: UUID) -> Optional[StudentCourse]:
        return self.db.query(StudentCourse).filter(
            StudentCourse.student_profile_id == student_profile_id,
            StudentCourse.course_id == course_id,
            StudentCourse.academic_term_id == academic_term_id
        ).first()

    def get_list(
        self,
        student_profile_id: UUID,
        course_id: Optional[UUID] = None,
        academic_term_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[StudentCourse]:
        query = self.db.query(StudentCourse).filter(StudentCourse.student_profile_id == student_profile_id)
        if course_id:
            query = query.filter(StudentCourse.course_id == course_id)
        if academic_term_id:
            query = query.filter(StudentCourse.academic_term_id == academic_term_id)
        return query.offset(skip).limit(limit).all()

    def create(self, student_course: StudentCourse) -> StudentCourse:
        self.db.add(student_course)
        self.db.flush()
        return student_course

    def update(self, student_course: StudentCourse) -> StudentCourse:
        self.db.add(student_course)
        self.db.flush()
        return student_course

    def delete(self, student_course: StudentCourse) -> None:
        self.db.delete(student_course)
        self.db.flush()

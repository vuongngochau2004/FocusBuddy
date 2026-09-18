from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from typing import List

from app.models.module_1_user_management.student_profile import StudentProfile
from app.models.module_2_academic_management.student_course import StudentCourse, CourseStatus
from app.models.module_7_file_processing.uploaded_file import UploadedFile
from app.models.module_7_file_processing.file_extraction import FileExtraction
from app.repositories.module_2_academic_management.student_course_repository import StudentCourseRepository
from app.schemas.module_2_academic_management.student_course import StudentCourseCreate, StudentCourseUpdate
from app.schemas.grade_import import GradeImportRequest, GradeImportResponse, GradeImportError

class GradeService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = StudentCourseRepository(db)

    def _get_student_profile(self, user_id: str) -> StudentProfile:
        try:
            uid = UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")
            
        profile = self.db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Student Profile not found for this user.")
        return profile

    def create_grade(self, user_id: str, data: StudentCourseCreate) -> StudentCourse:
        profile = self._get_student_profile(user_id)
        
        # Check duplicate
        existing = self.repo.get_by_student_and_course_term(profile.id, data.course_id, data.academic_term_id)
        if existing:
            raise HTTPException(status_code=400, detail="Grade for this course and term already exists.")

        grade = StudentCourse(
            student_profile_id=profile.id,
            course_id=data.course_id,
            academic_term_id=data.academic_term_id,
            score_process=data.score_process,
            score_midterm=data.score_midterm,
            score_final=data.score_final,
            total_score=data.total_score,
            letter_grade=data.letter_grade,
            grade_point=data.grade_point,
            status=data.status,
            attempt_number=data.attempt_number
        )
        grade = self.repo.create(grade)
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def update_grade(self, user_id: str, grade_id: UUID, data: StudentCourseUpdate) -> StudentCourse:
        profile = self._get_student_profile(user_id)
        grade = self.repo.get_by_id(grade_id)
        if not grade or grade.student_profile_id != profile.id:
            raise HTTPException(status_code=404, detail="Grade not found or permission denied.")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(grade, key, value)

        grade = self.repo.update(grade)
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def get_grade(self, user_id: str, grade_id: UUID) -> StudentCourse:
        profile = self._get_student_profile(user_id)
        grade = self.repo.get_by_id(grade_id)
        if not grade or grade.student_profile_id != profile.id:
            raise HTTPException(status_code=404, detail="Grade not found or permission denied.")
        return grade

    def get_grades(self, user_id: str, course_id: UUID = None, term_id: UUID = None, skip: int = 0, limit: int = 100) -> List[StudentCourse]:
        profile = self._get_student_profile(user_id)
        return self.repo.get_list(profile.id, course_id=course_id, academic_term_id=term_id, skip=skip, limit=limit)

    def delete_grade(self, user_id: str, grade_id: UUID) -> None:
        profile = self._get_student_profile(user_id)
        grade = self.repo.get_by_id(grade_id)
        if not grade or grade.student_profile_id != profile.id:
            raise HTTPException(status_code=404, detail="Grade not found or permission denied.")
        
        self.repo.delete(grade)
        self.db.commit()

    def import_grades(self, user_id: str, data: GradeImportRequest) -> GradeImportResponse:
        profile = self._get_student_profile(user_id)
        
        # Verify file ownership
        file_record = self.db.query(UploadedFile).filter(UploadedFile.id == data.file_id).first()
        if not file_record or str(file_record.user_id) != user_id:
            raise HTTPException(status_code=404, detail="File not found or permission denied")
            
        # Get extraction
        extraction = self.db.query(FileExtraction).filter(FileExtraction.file_id == data.file_id).first()
        if not extraction or not extraction.structured_data:
            raise HTTPException(status_code=400, detail="File extraction not found or has no structured data")
            
        structured_data = extraction.structured_data
        if not isinstance(structured_data, list):
            raise HTTPException(status_code=400, detail="Invalid structured data format, expected list of rows")

        total = len(structured_data)
        success = 0
        failed = 0
        errors = []

        try:
            with self.db.begin_nested():
                for i, row in enumerate(structured_data):
                    try:
                        # Extract basic required fields. Use string conversion just in case
                        course_id_str = row.get("course_id")
                        academic_term_id_str = row.get("academic_term_id")
                        
                        if not course_id_str or not academic_term_id_str:
                            raise ValueError("Missing course_id or academic_term_id")
                            
                        c_id = UUID(course_id_str)
                        t_id = UUID(academic_term_id_str)
                        
                        # Note: In a real system we should also validate if c_id and t_id exist in DB
                        # For the sake of simplicity and avoiding extra DB queries, 
                        # foreign key constraint will catch non-existent courses/terms.
                        
                        grade = StudentCourse(
                            student_profile_id=profile.id,
                            course_id=c_id,
                            academic_term_id=t_id,
                            score_process=float(row.get("score_process")) if row.get("score_process") else None,
                            score_midterm=float(row.get("score_midterm")) if row.get("score_midterm") else None,
                            score_final=float(row.get("score_final")) if row.get("score_final") else None,
                            total_score=float(row.get("total_score")) if row.get("total_score") else None,
                            letter_grade=row.get("letter_grade"),
                            grade_point=float(row.get("grade_point")) if row.get("grade_point") else None
                        )
                        self.db.add(grade)
                        success += 1
                        
                    except Exception as e:
                        failed += 1
                        errors.append(GradeImportError(row_index=i, reason=str(e)))
                
                # Atomic commit requirement: if any failed, rollback
                if failed > 0:
                    self.db.rollback()
                    raise ValueError("Atomic transaction failed due to errors")

            # If we reach here, begin_nested() completes and we can commit the outer transaction
            self.db.commit()
            
        except Exception as e:
            # Revert the outer transaction just in case
            self.db.rollback()
            if "Atomic transaction failed" not in str(e):
                # Unknown error during transaction
                raise HTTPException(status_code=500, detail=str(e))
                
        # If atomic transaction failed, everything is rolled back, return 400 with details
        if failed > 0:
            raise HTTPException(status_code=400, detail={
                "message": "Import failed. All changes rolled back.",
                "total_rows": total,
                "success_rows": 0, # Since we rolled back
                "failed_rows": failed,
                "errors": [err.model_dump() for err in errors]
            })

        return GradeImportResponse(
            total_rows=total,
            success_rows=success,
            failed_rows=0,
            errors=[]
        )

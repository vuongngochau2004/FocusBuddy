import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

schemas = {
    "university": """from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class UniversityBase(BaseModel):
    name: str = Field(..., max_length=255)
    short_name: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = None

class UniversityCreate(UniversityBase):
    pass

class UniversityUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    short_name: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = None

class UniversityResponse(UniversityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UniversityListResponse(BaseModel):
    items: list[UniversityResponse]
    total: int
""",
    "major": """from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class MajorBase(BaseModel):
    university_id: UUID
    name: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class MajorCreate(MajorBase):
    pass

class MajorUpdate(BaseModel):
    university_id: Optional[UUID] = None
    name: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class MajorResponse(MajorBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class MajorListResponse(BaseModel):
    items: list[MajorResponse]
    total: int
""",
    "curriculum": """from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class CurriculumBase(BaseModel):
    major_id: UUID
    name: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    admission_year: int
    total_credits: int
    description: Optional[str] = None

class CurriculumCreate(CurriculumBase):
    pass

class CurriculumUpdate(BaseModel):
    major_id: Optional[UUID] = None
    name: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    admission_year: Optional[int] = None
    total_credits: Optional[int] = None
    description: Optional[str] = None

class CurriculumResponse(CurriculumBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CurriculumListResponse(BaseModel):
    items: list[CurriculumResponse]
    total: int
""",
    "course": """from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module_2_academic_management.course import CourseType

class CourseBase(BaseModel):
    major_id: Optional[UUID] = None
    course_code: str = Field(..., max_length=20)
    course_name: str = Field(..., max_length=255)
    credits: int
    course_type: Optional[CourseType] = None
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    major_id: Optional[UUID] = None
    course_code: Optional[str] = Field(None, max_length=20)
    course_name: Optional[str] = Field(None, max_length=255)
    credits: Optional[int] = None
    course_type: Optional[CourseType] = None
    description: Optional[str] = None

class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
""",
    "academic_term": """from typing import Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.module_2_academic_management.academic_term import SemesterType

class AcademicTermBase(BaseModel):
    display_name: str = Field(..., max_length=20)
    academic_year: str = Field(..., max_length=20)
    semester_type: SemesterType
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AcademicTermCreate(AcademicTermBase):
    pass

class AcademicTermUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=20)
    academic_year: Optional[str] = Field(None, max_length=20)
    semester_type: Optional[SemesterType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AcademicTermResponse(AcademicTermBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AcademicTermListResponse(BaseModel):
    items: list[AcademicTermResponse]
    total: int
"""
}

repos = {
    "university_repository": """from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_1_user_management.university import University

class UniversityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, university_id: UUID) -> Optional[University]:
        return self.db.query(University).filter(University.id == university_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[University], int]:
        query = self.db.query(University)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> University:
        db_obj = University(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: University, update_data: dict) -> University:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: University) -> None:
        self.db.delete(db_obj)
        self.db.commit()
""",
    "major_repository": """from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_1_user_management.major import Major

class MajorRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, major_id: UUID) -> Optional[Major]:
        return self.db.query(Major).filter(Major.id == major_id).first()

    def get_all(self, university_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Major], int]:
        query = self.db.query(Major)
        if university_id:
            query = query.filter(Major.university_id == university_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Major:
        db_obj = Major(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Major, update_data: dict) -> Major:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Major) -> None:
        self.db.delete(db_obj)
        self.db.commit()
""",
    "curriculum_repository": """from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.curriculum import Curriculum

class CurriculumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, curriculum_id: UUID) -> Optional[Curriculum]:
        return self.db.query(Curriculum).filter(Curriculum.id == curriculum_id).first()

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Curriculum], int]:
        query = self.db.query(Curriculum)
        if major_id:
            query = query.filter(Curriculum.major_id == major_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Curriculum:
        db_obj = Curriculum(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Curriculum, update_data: dict) -> Curriculum:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Curriculum) -> None:
        self.db.delete(db_obj)
        self.db.commit()
""",
    "course_repository": """from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.course import Course

class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: UUID) -> Optional[Course]:
        return self.db.query(Course).filter(Course.id == course_id).first()

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Course], int]:
        query = self.db.query(Course)
        if major_id:
            query = query.filter(Course.major_id == major_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> Course:
        db_obj = Course(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Course, update_data: dict) -> Course:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Course) -> None:
        self.db.delete(db_obj)
        self.db.commit()
""",
    "academic_term_repository": """from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.module_2_academic_management.academic_term import AcademicTerm

class AcademicTermRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, term_id: UUID) -> Optional[AcademicTerm]:
        return self.db.query(AcademicTerm).filter(AcademicTerm.id == term_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[AcademicTerm], int]:
        query = self.db.query(AcademicTerm)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, data: dict) -> AcademicTerm:
        db_obj = AcademicTerm(**data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: AcademicTerm, update_data: dict) -> AcademicTerm:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: AcademicTerm) -> None:
        self.db.delete(db_obj)
        self.db.commit()
"""
}

services = {
    "university_service": """from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.university_repository import UniversityRepository
from app.schemas.university import UniversityCreate, UniversityUpdate
from app.models.module_1_user_management.university import University

class UniversityService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UniversityRepository(db)

    def get_by_id(self, item_id: UUID) -> University:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="University not found"
            )
        return item

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[University], int]:
        return self.repo.get_all(skip=skip, limit=limit)

    def create(self, data_in: UniversityCreate) -> University:
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create university. Data might be invalid or conflict."
            )

    def update(self, item_id: UUID, data_in: UniversityUpdate) -> University:
        item = self.get_by_id(item_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update university."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete university. It might be referenced by other entities."
            )
""",
    "major_service": """from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.major_repository import MajorRepository
from app.repositories.university_repository import UniversityRepository
from app.schemas.major import MajorCreate, MajorUpdate
from app.models.module_1_user_management.major import Major

class MajorService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MajorRepository(db)
        self.univ_repo = UniversityRepository(db)

    def get_by_id(self, item_id: UUID) -> Major:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major not found"
            )
        return item

    def get_all(self, university_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Major], int]:
        return self.repo.get_all(university_id=university_id, skip=skip, limit=limit)

    def _check_university(self, university_id: UUID):
        univ = self.univ_repo.get_by_id(university_id)
        if not univ:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="University not found"
            )

    def create(self, data_in: MajorCreate) -> Major:
        self._check_university(data_in.university_id)
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create major."
            )

    def update(self, item_id: UUID, data_in: MajorUpdate) -> Major:
        item = self.get_by_id(item_id)
        if data_in.university_id is not None:
            self._check_university(data_in.university_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update major."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete major. It might be referenced by other entities."
            )
""",
    "curriculum_service": """from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.major_repository import MajorRepository
from app.schemas.curriculum import CurriculumCreate, CurriculumUpdate
from app.models.module_2_academic_management.curriculum import Curriculum

class CurriculumService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CurriculumRepository(db)
        self.major_repo = MajorRepository(db)

    def get_by_id(self, item_id: UUID) -> Curriculum:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum not found"
            )
        return item

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Curriculum], int]:
        return self.repo.get_all(major_id=major_id, skip=skip, limit=limit)

    def _check_major(self, major_id: UUID):
        major = self.major_repo.get_by_id(major_id)
        if not major:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major not found"
            )

    def create(self, data_in: CurriculumCreate) -> Curriculum:
        self._check_major(data_in.major_id)
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create curriculum."
            )

    def update(self, item_id: UUID, data_in: CurriculumUpdate) -> Curriculum:
        item = self.get_by_id(item_id)
        if data_in.major_id is not None:
            self._check_major(data_in.major_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update curriculum."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete curriculum. It might be referenced by other entities."
            )
""",
    "course_service": """from typing import List, Tuple, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.course_repository import CourseRepository
from app.repositories.major_repository import MajorRepository
from app.schemas.course import CourseCreate, CourseUpdate
from app.models.module_2_academic_management.course import Course

class CourseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CourseRepository(db)
        self.major_repo = MajorRepository(db)

    def get_by_id(self, item_id: UUID) -> Course:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return item

    def get_all(self, major_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[Course], int]:
        return self.repo.get_all(major_id=major_id, skip=skip, limit=limit)

    def _check_major(self, major_id: UUID):
        major = self.major_repo.get_by_id(major_id)
        if not major:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Major not found"
            )

    def create(self, data_in: CourseCreate) -> Course:
        if data_in.major_id:
            self._check_major(data_in.major_id)
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create course."
            )

    def update(self, item_id: UUID, data_in: CourseUpdate) -> Course:
        item = self.get_by_id(item_id)
        if data_in.major_id is not None:
            self._check_major(data_in.major_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update course."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete course. It might be referenced by other entities."
            )
""",
    "academic_term_service": """from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.academic_term_repository import AcademicTermRepository
from app.schemas.academic_term import AcademicTermCreate, AcademicTermUpdate
from app.models.module_2_academic_management.academic_term import AcademicTerm

class AcademicTermService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AcademicTermRepository(db)

    def get_by_id(self, item_id: UUID) -> AcademicTerm:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AcademicTerm not found"
            )
        return item

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[AcademicTerm], int]:
        return self.repo.get_all(skip=skip, limit=limit)

    def create(self, data_in: AcademicTermCreate) -> AcademicTerm:
        try:
            return self.repo.create(data_in.model_dump())
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create academic term."
            )

    def update(self, item_id: UUID, data_in: AcademicTermUpdate) -> AcademicTerm:
        item = self.get_by_id(item_id)
        update_data = data_in.model_dump(exclude_unset=True)
        try:
            return self.repo.update(item, update_data)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update academic term."
            )

    def delete(self, item_id: UUID) -> None:
        item = self.get_by_id(item_id)
        try:
            self.repo.delete(item)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not delete academic term. It might be referenced by other entities."
            )
"""
}

routers = {
    "universities": """from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.university import UniversityCreate, UniversityUpdate, UniversityResponse, UniversityListResponse
from app.services.university_service import UniversityService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> UniversityService:
    return UniversityService(db)

@router.post("", response_model=UniversityResponse, status_code=status.HTTP_201_CREATED)
def create_university(
    *,
    service: UniversityService = Depends(get_service),
    data_in: UniversityCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=UniversityListResponse)
def read_universities(
    skip: int = 0,
    limit: int = 100,
    service: UniversityService = Depends(get_service),
) -> Any:
    items, total = service.get_all(skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=UniversityResponse)
def read_university(
    *,
    item_id: UUID,
    service: UniversityService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=UniversityResponse)
def update_university(
    *,
    item_id: UUID,
    data_in: UniversityUpdate,
    service: UniversityService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    *,
    item_id: UUID,
    service: UniversityService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
""",
    "majors": """from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.major import MajorCreate, MajorUpdate, MajorResponse, MajorListResponse
from app.services.major_service import MajorService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> MajorService:
    return MajorService(db)

@router.post("", response_model=MajorResponse, status_code=status.HTTP_201_CREATED)
def create_major(
    *,
    service: MajorService = Depends(get_service),
    data_in: MajorCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=MajorListResponse)
def read_majors(
    university_id: Optional[UUID] = Query(None, description="Filter by University ID"),
    skip: int = 0,
    limit: int = 100,
    service: MajorService = Depends(get_service),
) -> Any:
    items, total = service.get_all(university_id=university_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=MajorResponse)
def read_major(
    *,
    item_id: UUID,
    service: MajorService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=MajorResponse)
def update_major(
    *,
    item_id: UUID,
    data_in: MajorUpdate,
    service: MajorService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_major(
    *,
    item_id: UUID,
    service: MajorService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
""",
    "curriculums": """from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.curriculum import CurriculumCreate, CurriculumUpdate, CurriculumResponse, CurriculumListResponse
from app.services.curriculum_service import CurriculumService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> CurriculumService:
    return CurriculumService(db)

@router.post("", response_model=CurriculumResponse, status_code=status.HTTP_201_CREATED)
def create_curriculum(
    *,
    service: CurriculumService = Depends(get_service),
    data_in: CurriculumCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=CurriculumListResponse)
def read_curriculums(
    major_id: Optional[UUID] = Query(None, description="Filter by Major ID"),
    skip: int = 0,
    limit: int = 100,
    service: CurriculumService = Depends(get_service),
) -> Any:
    items, total = service.get_all(major_id=major_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=CurriculumResponse)
def read_curriculum(
    *,
    item_id: UUID,
    service: CurriculumService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=CurriculumResponse)
def update_curriculum(
    *,
    item_id: UUID,
    data_in: CurriculumUpdate,
    service: CurriculumService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_curriculum(
    *,
    item_id: UUID,
    service: CurriculumService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
""",
    "courses": """from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse
from app.services.course_service import CourseService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> CourseService:
    return CourseService(db)

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    *,
    service: CourseService = Depends(get_service),
    data_in: CourseCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=CourseListResponse)
def read_courses(
    major_id: Optional[UUID] = Query(None, description="Filter by Major ID"),
    skip: int = 0,
    limit: int = 100,
    service: CourseService = Depends(get_service),
) -> Any:
    items, total = service.get_all(major_id=major_id, skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=CourseResponse)
def read_course(
    *,
    item_id: UUID,
    service: CourseService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=CourseResponse)
def update_course(
    *,
    item_id: UUID,
    data_in: CourseUpdate,
    service: CourseService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    *,
    item_id: UUID,
    service: CourseService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
""",
    "academic_terms": """from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.academic_term import AcademicTermCreate, AcademicTermUpdate, AcademicTermResponse, AcademicTermListResponse
from app.services.academic_term_service import AcademicTermService

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> AcademicTermService:
    return AcademicTermService(db)

@router.post("", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED)
def create_academic_term(
    *,
    service: AcademicTermService = Depends(get_service),
    data_in: AcademicTermCreate,
) -> Any:
    return service.create(data_in=data_in)

@router.get("", response_model=AcademicTermListResponse)
def read_academic_terms(
    skip: int = 0,
    limit: int = 100,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    items, total = service.get_all(skip=skip, limit=limit)
    return {"items": items, "total": total}

@router.get("/{item_id}", response_model=AcademicTermResponse)
def read_academic_term(
    *,
    item_id: UUID,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    return service.get_by_id(item_id=item_id)

@router.put("/{item_id}", response_model=AcademicTermResponse)
def update_academic_term(
    *,
    item_id: UUID,
    data_in: AcademicTermUpdate,
    service: AcademicTermService = Depends(get_service),
) -> Any:
    return service.update(item_id=item_id, data_in=data_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_academic_term(
    *,
    item_id: UUID,
    service: AcademicTermService = Depends(get_service),
) -> None:
    service.delete(item_id=item_id)
"""
}

base_path = r"d:\DUT AI CLUB\PROJECT\FORCUS_BUDDY\FocusBuddy\be\app"

for name, content in schemas.items():
    create_file(os.path.join(base_path, "schemas", f"{name}.py"), content)

for name, content in repos.items():
    create_file(os.path.join(base_path, "repositories", f"{name}.py"), content)

for name, content in services.items():
    create_file(os.path.join(base_path, "services", f"{name}.py"), content)

for name, content in routers.items():
    create_file(os.path.join(base_path, "api", "v1", f"{name}.py"), content)

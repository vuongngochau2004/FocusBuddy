from enum import Enum
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator


class StudentType(str, Enum):
    HIGH_SCHOOL = "HIGH_SCHOOL"
    UNIVERSITY = "UNIVERSITY"


class ExtractorEngine(str, Enum):
    CUSTOM_LLM = "custom_llm"
    GEMINI_VISION = "gemini_vision"
    PADDLE_OCR = "paddle_ocr"


def clean_score_value(v: Any) -> Optional[Union[float, str]]:
    """Helper to convert string numbers to float, while preserving status strings like 'Đ', 'Đạt', 'CĐ'."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        v_str = v.strip()
        if not v_str:
            return None
        try:
            return float(v_str.replace(",", "."))
        except ValueError:
            return v_str
    return None


# ==================== 1. HIGH SCHOOL TRANSCRIPT SCHEMA ====================

class HighSchoolSubjectGrade(BaseModel):
    subject_name: str = Field(..., description="Tên môn học (Toán, Ngữ văn, Thể dục, Âm nhạc...)")
    tx_scores: List[Optional[Union[float, str]]] = Field(default_factory=list, description="Danh sách điểm thường xuyên (15 phút, miệng hoặc Đ/CĐ)")
    midterm_score: Optional[Union[float, str]] = Field(None, description="Điểm giữa kỳ (ĐĐGgk hoặc 'Đ'/'Đạt')")
    final_score: Optional[Union[float, str]] = Field(None, description="Điểm cuối kỳ (ĐĐGck hoặc 'Đ'/'Đạt')")
    tbm_score: Optional[Union[float, str]] = Field(None, description="Điểm trung bình môn (số hoặc 'Đ'/'Đạt')")

    @field_validator("tx_scores", mode="before")
    @classmethod
    def clean_tx_scores(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            cleaned = []
            for item in v:
                cleaned_item = clean_score_value(item)
                if cleaned_item is not None:
                    cleaned.append(cleaned_item)
            return cleaned
        return []

    @field_validator("midterm_score", "final_score", "tbm_score", mode="before")
    @classmethod
    def clean_scores(cls, v):
        return clean_score_value(v)


class HighSchoolTranscript(BaseModel):
    student_type: Optional[StudentType] = Field(default=StudentType.HIGH_SCHOOL)
    student_name: Optional[str] = Field(None, description="Họ và tên học sinh")
    class_name: Optional[str] = Field(None, description="Tên lớp học (vd: 10A1, 12C3)")
    school_year: Optional[str] = Field(None, description="Năm học (vd: 2023-2024)")
    semester: Optional[str] = Field(None, description="Học kỳ (HK1, HK2, Cả năm)")
    academic_performance: Optional[str] = Field(None, description="Học lực (Tốt, Khá, Đạt, Giỏi...)")
    conduct: Optional[str] = Field(None, description="Hạnh kiểm (Tốt, Khá, Trung bình...)")
    subjects: List[HighSchoolSubjectGrade] = Field(default_factory=list)

    @field_validator("student_type", mode="before")
    @classmethod
    def clean_student_type(cls, v):
        if not v:
            return StudentType.HIGH_SCHOOL
        return v


# ==================== 2. UNIVERSITY TRANSCRIPT SCHEMA ====================

class UniversityCourseGrade(BaseModel):
    course_code: Optional[str] = Field(None, description="Mã học phần / môn học (vd: 1020252.2520.24.15)")
    course_name: str = Field(..., description="Tên đầy đủ môn học / học phần")
    credits: Optional[Union[float, int]] = Field(1, description="Số tín chỉ môn học (vd: 2 hoặc 2.5)")
    process_score: Optional[Union[float, str]] = Field(None, description="Điểm quá trình / bài tập / chuyên cần (QT/BT/CC)")
    midterm_score: Optional[Union[float, str]] = Field(None, description="Điểm giữa kỳ (GK)")
    exam_score: Optional[Union[float, str]] = Field(None, description="Điểm thi cuối kỳ / đồ án (CK/BV/Thi)")
    score_10: Optional[Union[float, str]] = Field(None, description="Điểm học phần tổng kết thang 10 (vd: 8.9, 8.3, 9.9)")
    score_4: Optional[Union[float, str]] = Field(None, description="Điểm học phần thang 4 (vd: 4.0, 3.5, 3.0)")
    grade_char: Optional[str] = Field(None, description="Điểm chữ (A+, A, B+, B, C+, C, D+, D, F, Đ, P, Pass)")

    @field_validator("credits", mode="before")
    @classmethod
    def clean_credits(cls, v):
        if v is None:
            return 1
        try:
            val = float(str(v).replace(",", "."))
            return int(val) if val.is_integer() else val
        except (ValueError, TypeError):
            return 1

    @field_validator("process_score", "midterm_score", "exam_score", "score_10", "score_4", mode="before")
    @classmethod
    def clean_scores(cls, v):
        return clean_score_value(v)


class UniversityTranscript(BaseModel):
    student_type: Optional[StudentType] = Field(default=StudentType.UNIVERSITY)
    student_id: Optional[str] = Field(None, description="Mã số sinh viên (MSSV)")
    student_name: Optional[str] = Field(None, description="Họ và tên sinh viên")
    major: Optional[str] = Field(None, description="Ngành học / Chuyên ngành")
    academic_term: Optional[str] = Field(None, description="Học kỳ - Năm học (vd: 2/2025-2026)")
    semester_gpa: Optional[float] = Field(None, description="GPA học kỳ (thang 4)")
    cumulative_gpa: Optional[float] = Field(None, description="GPA tích lũy (thang 4)")
    total_credits: Optional[Union[float, int]] = Field(None, description="Tổng số tín chỉ")
    courses: List[UniversityCourseGrade] = Field(default_factory=list)

    @field_validator("student_type", mode="before")
    @classmethod
    def clean_student_type(cls, v):
        if not v:
            return StudentType.UNIVERSITY
        return v


# ==================== 3. UNIFIED EXTRACTION RESULT ====================

class ExtractionResult(BaseModel):
    success: bool
    student_type: Optional[StudentType] = None
    data: Optional[Union[HighSchoolTranscript, UniversityTranscript, Dict[str, Any]]] = None
    engine_used: str
    error_message: Optional[str] = None

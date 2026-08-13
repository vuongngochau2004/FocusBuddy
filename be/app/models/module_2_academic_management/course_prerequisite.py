import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # FK -> courses.id
    # This is the target course that requires a prerequisite.
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
    )

    # FK -> courses.id
    # This is the prerequisite course that must be completed first.
    prerequisite_course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
    )

    # Relationship: CoursePrerequisite N --- 1 Course (Target)
    course = relationship(
        "Course",
        foreign_keys=[course_id],
        back_populates="prerequisites",
    )

    # Relationship: CoursePrerequisite N --- 1 Course (Prerequisite)
    prerequisite_course = relationship(
        "Course",
        foreign_keys=[prerequisite_course_id],
        back_populates="is_prerequisite_for",
    )

import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_7_file_processing.uploaded_file import UploadedFile
from app.models.module_7_file_processing.file_extraction import FileExtraction

def seed_file_processing(session: Session, users):
    logger.info(f"  [>] Seeding file processing data...")
    
    for user in users:
        for _ in range(random.randint(1, 3)):
            file_name = f"{fake.word()}_{fake.random_int(100,999)}.pdf"
            
            # 1. Uploaded File
            file = UploadedFile(
                user_id=user.id,
                file_name=file_name,
                file_size=random.randint(1000, 5000000), # 1KB to 5MB
                file_type="PDF",
                storage_path=f"s3://focusbuddy-bucket/users/{user.id}/{file_name}",
                status=random.choice(["PROCESSING", "PROCESSED", "FAILED"]),
                uploaded_at=fake.date_time_this_month()
            )
            session.add(file)
            session.flush()
            
            # 2. File Extraction
            if file.status == "PROCESSED":
                extraction = FileExtraction(
                    file_id=file.id,
                    extraction_method=random.choice(["OCR", "PDF_PARSER", "AI_VISION"]),
                    raw_text=fake.text(),
                    confidence_score=round(random.uniform(0.7, 0.99), 2),
                    validation_status=random.choice(["VALID", "WARNING", "INVALID"]),
                    created_at=fake.date_time_this_month()
                )
                session.add(extraction)

def run_module_7_seed(session: Session, users):
    logger.info("\n[7/8] Seeding File Processing (Module 7)...")
    try:
        seed_file_processing(session, users)
        session.commit()
        logger.info("  ✓ Module 7 seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 7 seed failed: {e}")
        raise

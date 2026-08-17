import sys
import os
import json
from PIL import Image, ImageDraw

# Add current dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Ensure UTF-8 output encoding for Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.modules.ocr.service import TranscriptAnalysisService
from app.modules.ocr.factory import ExtractorFactory


def create_sample_transcript_image(filename="sample_transcript.png"):
    """Generates a dummy transcript image for testing if no real image is provided."""
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    d = ImageDraw.Draw(img)

    d.text((250, 30), "TRUONG DAI HOC CONG NGHE", fill=(0, 0, 0))
    d.text((270, 60), "BANG DIEM CAN BO HOC TAP", fill=(0, 0, 0))
    d.text((50, 100), "MSSV: 20020101", fill=(0, 0, 0))
    d.text((50, 120), "Ho va ten: Nguyen Van A", fill=(0, 0, 0))
    d.text((50, 140), "Nganh: Cong nghe Thong tin", fill=(0, 0, 0))

    d.text((50, 180), "Ma HP    | Ten Hoc Phan             | TC | Diem 10 | Diem Chu", fill=(0, 0, 0))
    d.text((50, 200), "-----------------------------------------------------------------", fill=(0, 0, 0))
    d.text((50, 220), "INT1001  | Nhap mon Lap trinh       | 3  | 8.5     | A", fill=(0, 0, 0))
    d.text((50, 240), "MATH101  | Toan cao cap 1           | 3  | 7.8     | B+", fill=(0, 0, 0))
    d.text((50, 260), "CS201    | Cau truc du lieu         | 4  | 9.0     | A+", fill=(0, 0, 0))

    d.text((50, 320), "GPA Hoc ky: 3.58", fill=(0, 0, 0))
    d.text((50, 340), "GPA Tich luy: 3.50", fill=(0, 0, 0))

    img.save(filename)
    return filename


def main():
    image_path = None
    engine = None

    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        image_path = sys.argv[1]
    else:
        image_path = create_sample_transcript_image()

    if len(sys.argv) > 2:
        engine = sys.argv[2]

    print(f"\n--- Testing Transcript Extraction on: {image_path} ---")

    with open(image_path, "rb") as f:
        file_bytes = f.read()

    mime_type = "image/png" if image_path.endswith(".png") else "image/jpeg"

    service = TranscriptAnalysisService()
    target_engine = engine or service.current_engine
    print(f"Target Extractor Engine: {target_engine}")

    result = service.process_transcript_file(
        file_bytes=file_bytes,
        mime_type=mime_type,
        override_engine_name=target_engine,
    )

    print("\n--- EXTRACTION RESULT ---")
    print(f"Success: {result.success}")
    print(f"Engine Used: {result.engine_used}")
    print(f"Student Type Identified: {result.student_type}")

    if result.success and result.data:
        print("\nExtracted Structured Data (JSON):")
        try:
            print(json.dumps(result.data.model_dump(), indent=2, ensure_ascii=False))
        except Exception:
            print(json.dumps(result.data.model_dump(), indent=2, ensure_ascii=True))
    else:
        print(f"Error Message: {result.error_message}")


if __name__ == "__main__":
    main()

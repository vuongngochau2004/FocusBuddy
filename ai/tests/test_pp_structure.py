import io
import pytest
from PIL import Image, ImageDraw
from app.modules.ocr.service import PPStructureService

def create_synthetic_table_image() -> bytes:
    """
    Creates a simple synthetic image containing a table with text for testing.
    """
    img = Image.new("RGB", (400, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw table border and lines
    draw.rectangle([20, 20, 380, 180], outline=(0, 0, 0), width=2)
    draw.line([20, 70, 380, 70], fill=(0, 0, 0), width=2)
    draw.line([200, 20, 200, 180], fill=(0, 0, 0), width=2)
    
    # Draw text headers and cells
    draw.text((30, 35), "Mon hoc", fill=(0, 0, 0))
    draw.text((220, 35), "Diem so", fill=(0, 0, 0))
    draw.text((30, 95), "Toan cao cap", fill=(0, 0, 0))
    draw.text((220, 95), "9.5", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_html_table_parser():
    service = PPStructureService()
    html_sample = "<table><tr><td>Môn học</td><td>Điểm</td></tr><tr><td>Toán</td><td>10.0</td></tr></table>"
    matrix = service.parse_html_table_to_matrix(html_sample)
    
    assert len(matrix) == 2
    assert matrix[0] == ["Môn học", "Điểm"]
    assert matrix[1] == ["Toán", "10.0"]

def test_image_decoding_error():
    service = PPStructureService()
    invalid_bytes = b"not an image"
    res = service.process_image_bytes(invalid_bytes)
    
    assert res.success is False
    assert "Failed to decode image" in res.message

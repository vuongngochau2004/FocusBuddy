import time
import logging
import numpy as np
import cv2
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.modules.ocr.schemas import (
    OCRExtractionResponse,
    TableStructureResult,
)
from app.modules.ocr.preprocessing import (
    deskew_image,
    enhance_contrast,
    normalize_colored_paper,
    preprocess_cell_crop,
    remove_watermark_and_binarize,
)


from app.modules.ocr.vietocr_engine import vietocr_engine

logger = logging.getLogger("focusbuddy.ai.ocr")

class PPStructureService:
    """
    Hybrid PP-Structure + VietOCR Service:
    - Step 1: PP-Structure (TableStructureRecognition) parses layout & cell bounding boxes.
    - Step 2: OpenCV Preprocessing aligns & enhances cell crops.
    - Step 3: VietOCR (VGG-Transformer) recognizes accurate Vietnamese text in each cell.
    """
    def __init__(self, lang: Optional[str] = None, show_log: Optional[bool] = None):
        self.lang = lang or settings.OCR_LANG
        self.show_log = show_log if show_log is not None else settings.PADDLE_SHOW_LOG
        self._table_engine = None

    def _get_table_engine(self):
        """
        Lazy-loads TableStructureRecognition engine for layout segmentation.
        """
        if self._table_engine is None:
            try:
                from paddleocr import TableStructureRecognition
                logger.info("Initializing TableStructureRecognition engine...")
                self._table_engine = TableStructureRecognition()
                logger.info("TableStructureRecognition engine initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize TableStructureRecognition engine: {e}")
                raise e
        return self._table_engine

    def parse_html_table_to_matrix(self, html_str: str) -> List[List[str]]:
        """
        Parses HTML string (e.g. <table>...</table>) into a clean 2D matrix (list of row lists).
        """
        if not html_str:
            return []
        
        soup = BeautifulSoup(html_str, "html.parser")
        matrix: List[List[str]] = []
        
        rows = soup.find_all("tr")
        for row in rows:
            cells = row.find_all(["td", "th"])
            row_data = [cell.get_text(strip=True) for cell in cells]
            if row_data:
                matrix.append(row_data)
                
        return matrix

    def clean_gradebook_matrix(self, matrix: List[List[str]]) -> List[List[str]]:
        """
        Post-processing rule engine for Vietnamese academic gradebooks (paper photos & digital screenshots):
        1. Filters out non-grade noise rows (mobile headers, browser address bars, parent feedback, signatures).
        2. Filters out border noise digit sequences (e.g. 036000000035, 0301000000099).
        3. Standardizes Vietnamese subject names using fuzzy string matching.
        """
        import re
        import difflib

        STANDARD_SUBJECTS = [
            "Toán", "Toán học", "Vật lí", "Hóa học", "Sinh học", "Ngữ văn",
            "Lịch sử", "Địa lí", "Ngoại ngữ 1 (Tiếng Anh)", "Ngoại ngữ", "GDCD",
            "Công nghệ", "Thể dục", "Âm nhạc", "Mỹ thuật", "Tin học", "Môn học",
            "GDQP AN", "Tiếng Anh"
        ]

        NOISE_PHRASES = [
            "ý kiến của phụ huynh", "nhận xét của gvcn", "giáo viên chủ nhiệm",
            "chăm học", "phụ huynh", "ngày... tháng", "chữ ký", "quận", "thơng",
            "đạt học lực", "khen thưởng", "phong trào", "thành tích", "chữ ký của",
            "tracuu.vnedu.vn", "danh hiệu", "điểm tb", "hạnh kiểm", "học lực", "xếp hạng",
            "họa thị", "đáng đếm", "thổ thị", "propolition", "transled"
        ]

        cleaned_matrix: List[List[str]] = []

        for row in matrix:
            # Check if row is noise (mobile screenshot top/bottom bars, teacher comments, signatures)
            row_str_lower = " ".join(row).lower()
            if any(phrase in row_str_lower for phrase in NOISE_PHRASES):
                continue
            if re.search(r"\.{4,}", row_str_lower): # Skip dotted lines (...........)
                continue

            cleaned_row = []
            has_valid_data = False

            for col_idx, cell in enumerate(row):
                val = cell.strip()

                # Filter garbage digit sequence from paper borders or watermarks
                if re.match(r"^0[0-9]{4,}$", val):
                    val = ""

                # Filter random garbage English words from OCR noise
                if val.lower() in ["stat", "marker", "consection", "dialized", "upball", "states", "booted", "fill", "craft", "per", "bad"]:
                    val = ""

                # Fuzzy match subject names for the first 2 columns
                if val and col_idx <= 1 and len(val) >= 2:
                    matches = difflib.get_close_matches(val, STANDARD_SUBJECTS, n=1, cutoff=0.4)
                    if matches:
                        val = matches[0]

                if val:
                    has_valid_data = True
                cleaned_row.append(val)

            if has_valid_data:
                cleaned_matrix.append(cleaned_row)

        return cleaned_matrix



    def convert_matrix_to_csv(self, matrix: List[List[str]]) -> str:
        """
        Converts 2D table matrix into a CSV formatted string.
        """
        if not matrix:
            return ""
        
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        for row in matrix:
            writer.writerow(row)
        return output.getvalue()


    def process_image_bytes(self, image_bytes: bytes) -> OCRExtractionResponse:
        """
        Processes image through Hybrid Architecture:
        1. Preprocesses image (Deskew & Contrast Enhancement).
        2. PP-Structure detects table layout and cell bounding boxes.
        3. VietOCR (Transformer) extracts Vietnamese text for each cell crop.
        4. Injects extracted text into HTML, 2D matrix, and CSV output.
        """
        start_time = time.time()
        
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Fallback to PIL for WebP, HEIC or non-standard image formats
        if img is None:
            try:
                from PIL import Image
                import io
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as img_err:
                logger.warning(f"PIL fallback decode failed: {img_err}")
                img = None

        if img is None:
            return OCRExtractionResponse(
                success=False,
                tables=[],
                text_blocks=[],
                processing_time_ms=0.0,
                message="Failed to decode image file. Please provide a valid image (PNG/JPG/WEBP).",
            )


        # 1. Preprocess full document image (Deskew & Color Normalization for paper/digital documents)
        try:
            img = deskew_image(img)
            img = normalize_colored_paper(img)
        except Exception as prep_err:
            logger.warning(f"Image preprocessing warning: {prep_err}")




        # 2. PP-Structure Table Layout Recognition
        try:
            table_engine = self._get_table_engine()
            if hasattr(table_engine, "predict"):
                ts_results = list(table_engine.predict(input=img))
            else:
                ts_results = list(table_engine(img))
        except Exception as e:
            logger.error(f"Error during table structure execution: {e}", exc_info=True)
            return OCRExtractionResponse(
                success=False,
                tables=[],
                text_blocks=[],
                processing_time_ms=(time.time() - start_time) * 1000,
                message=f"Table OCR engine error: {str(e)}",
            )

        tables: List[TableStructureResult] = []
        text_blocks: List[Dict[str, Any]] = []
        table_idx = 0
        img_h, img_w = img.shape[:2]

        for item in ts_results:
            if isinstance(item, dict):
                cell_bboxes = item.get("bbox", [])
                struct_list = item.get("structure", [])
                html_str = "".join(struct_list)

                # 3. VietOCR Text Recognition on each cell crop
                cell_texts = []
                for box in cell_bboxes:
                    try:
                        pts = np.array(box, dtype=np.int32).reshape(-1, 2)
                        x_min, y_min = np.min(pts, axis=0)
                        x_max, y_max = np.max(pts, axis=0)
                        
                        # Add padding for clean cell cropping without clipping text edges
                        pad_x = 5
                        pad_y = 3
                        x_min = max(0, x_min - pad_x)
                        y_min = max(0, y_min - pad_y)
                        x_max = min(img_w, x_max + pad_x)
                        y_max = min(img_h, y_max + pad_y)
                        
                        cell_crop = img[y_min:y_max, x_min:x_max]

                        
                        if cell_crop.shape[0] > 4 and cell_crop.shape[1] > 4:
                            processed_crop = preprocess_cell_crop(cell_crop)
                            # Call VietOCR Transformer for Vietnamese text prediction
                            text_val = vietocr_engine.predict_cell_text(processed_crop)
                            cell_texts.append(text_val)
                        else:
                            cell_texts.append("")
                    except Exception as cell_err:
                        logger.warning(f"Error recognizing cell text with VietOCR: {cell_err}")
                        cell_texts.append("")

                # 4. Inject VietOCR text into HTML <td> tags
                if html_str and cell_texts:
                    soup = BeautifulSoup(html_str, "html.parser")
                    td_tags = soup.find_all("td")
                    for idx, tag in enumerate(td_tags):
                        if idx < len(cell_texts):
                            tag.string = cell_texts[idx]
                    html_str = str(soup)

                raw_matrix = self.parse_html_table_to_matrix(html_str)
                matrix = self.clean_gradebook_matrix(raw_matrix)
                csv_content = self.convert_matrix_to_csv(matrix)
                cell_count = sum(len(row) for row in matrix)


                tables.append(
                    TableStructureResult(
                        table_index=table_idx,
                        bbox=cell_bboxes,
                        html=html_str,
                        matrix=matrix,
                        csv_content=csv_content,
                        cell_count=cell_count,
                    )
                )

                table_idx += 1

        elapsed_ms = (time.time() - start_time) * 1000

        return OCRExtractionResponse(
            success=True,
            tables=tables,
            text_blocks=text_blocks,
            processing_time_ms=round(elapsed_ms, 2),
            message=f"Extracted {len(tables)} table(s) successfully with Hybrid PP-Structure + VietOCR.",
        )

# Global service instance
ocr_service = PPStructureService()

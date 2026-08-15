from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import Response
from app.modules.ocr.schemas import OCRExtractionResponse
from app.modules.ocr.service import ocr_service

router = APIRouter(
    prefix="/ocr",
    tags=["OCR & Table Recognition"],
)

@router.post(
    "/extract-table",
    response_model=OCRExtractionResponse,
    summary="Extract tables and structured data from an image file using PP-Structure",
    description="Upload an image (PNG/JPG) containing academic transcript, schedule, or tabular document to parse tables into 2D JSON matrix and CSV string.",
)
async def extract_table(
    file: UploadFile = File(..., description="Image file containing document or tables")
) -> OCRExtractionResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded.",
        )
    
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    response = ocr_service.process_image_bytes(content)
    if not response.success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=response.message or "Failed to process image.",
        )

    return response

@router.post(
    "/export-csv",
    summary="Extract tables from image and download directly as a .csv file",
    description="Upload an image containing a table to get a downloadable .csv file directly, fully compatible with Excel.",
)
async def export_csv(
    file: UploadFile = File(..., description="Image file containing document or tables")
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded.",
        )
    
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    response = ocr_service.process_image_bytes(content)
    if not response.success or not response.tables:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=response.message or "No tables detected in image.",
        )

    csv_data = response.tables[0].csv_content or ""
    # Add UTF-8 BOM (\ufeff) so Microsoft Excel opens Vietnamese characters correctly
    csv_bytes = "\ufeff".encode("utf-8") + csv_data.encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=bang_diem_extracted.csv"
        },
    )

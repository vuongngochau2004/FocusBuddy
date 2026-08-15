# Sử dụng image Python phiên bản nhẹ
FROM python:3.11-slim

# Cài đặt thư mục làm việc
WORKDIR /app

# Thiết lập biến môi trường để Python không tạo file .pyc và ghi log trực tiếp ra console
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy file cài đặt thư viện
COPY requirements.txt .

# Cài đặt thư viện
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng 8000
EXPOSE 8000

# Khởi chạy server FastAPI với chế độ hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

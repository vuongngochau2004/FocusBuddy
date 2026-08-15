# Sử dụng image node bản nhẹ (alpine) làm môi trường chạy
FROM node:20-alpine

# Thiết lập thư mục làm việc mặc định bên trong container
WORKDIR /app

# Copy các file quản lý dependencies vào thư mục làm việc
COPY package*.json ./

# Cài đặt các thư viện cần thiết
RUN npm install

# Copy toàn bộ mã nguồn dự án vào container
COPY . .

# Mở cổng 3000 (hoặc 5173 tuỳ thuộc vào React/Vite/NextJS) để có thể truy cập từ bên ngoài
EXPOSE 3000

# Khởi chạy server ở chế độ phát triển (development)
CMD ["npm", "run", "dev"]

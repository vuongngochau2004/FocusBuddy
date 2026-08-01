# EduTrack AI – Hệ Thống Theo Dõi Học Tập Tích Hợp Chatbot AI

## Cấu trúc dự án

```
edutrack-backend/                 ← NestJS Backend
├── prisma/
│   └── schema.prisma             ← Database schema (PostgreSQL)
├── src/
│   ├── main.ts                   ← Bootstrap + CORS + Swagger
│   ├── app.module.ts             ← Root Module
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   └── modules/
│       ├── auth/                 ← JWT Auth
│       ├── grades/               ← Grade CRUD + Stats
│       ├── upload/               ← File Upload + AI Extraction ⭐
│       │   ├── upload.module.ts
│       │   ├── upload.controller.ts
│       │   ├── upload.service.ts
│       │   └── grade-extractor.service.ts  ← Gemini Vision
│       └── ai-agent/             ← Multi-Agent System ⭐
│           ├── ai-agent.module.ts
│           ├── ai-agent.controller.ts
│           ├── ai-agent.service.ts         ← LangGraph Orchestrator
│           └── agents/
│               ├── supervisor.agent.ts     ← Intent Classification
│               ├── academic.agent.ts       ← Academic Analysis
│               └── psychology.agent.ts     ← Psychology Support

edutrack-frontend/                ← React + Vite Frontend
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                   ← Shell + Navigation
│   ├── index.css                 ← Design System (Dark Theme)
│   ├── types/index.ts            ← Shared TypeScript types
│   ├── api/client.ts             ← Axios + API functions
│   └── components/
│       ├── Dashboard.tsx         ← Charts + Upload + Grade Table ⭐
│       └── ChatBot.tsx           ← Multi-agent Chat UI ⭐
```

## Luồng dữ liệu Upload Bảng Điểm

```
Frontend (UploadZone)
  │── POST /api/upload/grade-sheet (multipart/form-data)
  │
Backend (UploadController)
  │── UploadService.saveFile()         → lưu DB, status=PENDING
  │── [async] extractAndSaveGrades()   → background job
  │     │── status = PROCESSING
  │     │── GradeExtractorService.extract()
  │     │     ├── [PDF/Image] → Gemini 1.5 Pro (multimodal)
  │     │     └── [Excel]     → xlsx parser → Gemini 1.5 Flash
  │     │── Parse JSON grades
  │     └── Upsert vào DB (Course + Grade)
  │
Frontend polling GET /api/upload/:id/status (mỗi 2 giây)
  └── Khi DONE → refresh Dashboard charts
```

## Luồng Multi-Agent Chat

```
User message
    │
    ▼
[SUPERVISOR AGENT] - Gemini Flash (nhanh, rẻ)
    │  classify: ACADEMIC | PSYCHOLOGY | GENERAL
    │
 ┌──┴─────────────────┐
 ▼                    ▼
[ACADEMIC AGENT]   [PSYCHOLOGY AGENT]
 Gemini Pro         Gemini Pro
 + Grade context    + Psychology log context
 + Chat history     + Chat history
    │                    │
    └────────┬───────────┘
             ▼
     Save to ChatHistory DB
             │
             ▼
     Return to Frontend
     (với intentScore %)
```

## Biến môi trường (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/edutrack"
GEMINI_API_KEY="your-google-gemini-api-key"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
```

## Khởi chạy

### Backend
```bash
cd edutrack-backend
npm install
npx prisma migrate dev --name init
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/docs
```

### Frontend
```bash
cd edutrack-frontend
npm install
npm run dev
# App: http://localhost:5173
```

## Dependencies cần thêm

```bash
# Backend - thêm xlsx cho Excel parsing
npm install xlsx

# Frontend
npm install  # đã có trong package.json
```

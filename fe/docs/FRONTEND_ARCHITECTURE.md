# FocusBuddy Frontend Architecture Guide

> **Project:** FocusBuddy (Next.js 14 App Router + React 18 + Tailwind CSS + Axios)  
> **Status:** MVP Baseline Established  
> **Version:** 1.0.0  

---

## 1. Architecture Overview

FocusBuddy Frontend is built around a lightweight **3-Layer Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI Layer: Next.js App Router Pages & Components         │
│    - Public: /login, /register                              │
│    - Protected: /dashboard, /schedule, /scores, /goals...   │
└──────────────────────────────┬──────────────────────────────┘
                               │ uses
┌──────────────────────────────▼──────────────────────────────┐
│ 2. State Layer: Minimal React AuthContext (useAuth)         │
│    - { user, token, isLoading, isAuthenticated }            │
│    - { login, register, logout, refreshUser }              │
└──────────────────────────────┬──────────────────────────────┘
                               │ calls
┌──────────────────────────────▼──────────────────────────────┐
│ 3. API Client & Services Layer (lib/api.ts & lib/services.ts)│
│    - Single Axios instance with Bearer Token Interceptor   │
│    - Typed Domain Services matching Backend APIs            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│ Backend FastAPI Service (be/app/api/v1/*)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
fe/
├── package.json              # Next 14.2.35, React 18.3.1, Axios 1.7.2, Framer Motion 11.3.0
├── src/
│   ├── app/
│   │   ├── (app)/            # Protected application routes (Sidebar + TopBar shell)
│   │   │   ├── layout.tsx    # App Shell Layout with Client AuthGuard
│   │   │   ├── chatbot/      # AI Chatbot with Streaming
│   │   │   ├── dashboard/    # Overview & KPI Analytics
│   │   │   ├── goals/        # Learning Goals
│   │   │   ├── mental-health/# Emotion Logs & Psychological Assessments
│   │   │   ├── schedule/     # Study Tasks & Sessions
│   │   │   ├── scores/       # Grades & GPA Tracking
│   │   │   └── settings/     # User Profile & Preferences
│   │   ├── login/page.tsx    # Public Login Page (JWT Auth)
│   │   ├── register/page.tsx # Public Register Page (Atomic 3-table register)
│   │   ├── layout.tsx        # Root HTML Layout + ThemeProvider + AuthProvider
│   │   └── page.tsx          # Root Redirector
│   ├── components/layout/    # Sidebar.tsx, TopBar.tsx, ThemeProvider.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx   # Centralized Session Management (user, token, login, logout)
│   ├── hooks/
│   │   └── useAuth.ts        # useAuth() hook
│   ├── lib/
│   │   ├── api.ts            # Central Axios instance with Bearer Interceptor & 401 Handler
│   │   ├── services.ts       # Typed Domain Services (authService, studyTaskService, etc.)
│   │   ├── constants.ts      # Constants
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── index.ts          # Canonical TypeScript Models & DTOs
└── docs/                     # Documentation & Contracts
```

---

## 3. Core Principles & Conventions

1. **Authentication**: All authenticated requests MUST include `Authorization: Bearer <token>`. Never use `X-User-Id` headers.
2. **Session Persistence**: Managed via `localStorage.getItem('focusbuddy_token')` and validated on app mount via `GET /api/v1/auth/me`.
3. **Route Guarding**: All pages in `app/(app)/*` are automatically guarded by `app/(app)/layout.tsx`. If `!isAuthenticated`, the client transitions to `/login`.
4. **Chatbot Streaming**: Consumed directly using browser `fetch` + `ReadableStream` (`reader.read()` + `TextDecoder`) to support Backend SSE response formats smoothly.
5. **No State Bloat**: Zero external state libraries (no Redux, no Zustand). React Context is sufficient for MVP scale.

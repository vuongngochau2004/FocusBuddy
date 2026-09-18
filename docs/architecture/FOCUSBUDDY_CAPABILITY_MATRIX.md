# FOCUSBUDDY CAPABILITY MATRIX

## 1. Overview
The Tool Architecture is designed around FocusBuddy's existing capabilities as a Raspberry Pi robot system. The priority is to orchestrate **Internal Capabilities** via Backend Services before reaching out to **External APIs**.

## 2. Capability Matrix

| Capability | Already exists? | Existing module/API | DB support? | Agent needs Tool? | External API needed? |
|------------|-----------------|---------------------|-------------|-------------------|----------------------|
| Schedule / Event Creation | YES | `study_session_service`, `study_task_service` | YES (PostgreSQL) | YES (`schedule.create`) | NO (Internal preferred) |
| Academic GPA Analysis | YES | `academic_performance_service`, `grade_service` | YES | YES (`academic.get_gpa`) | NO |
| Psychology Log / Assessment | YES | `emotion_log_service`, `mental_assessment_service` | YES | YES (`psychology.log`) | NO |
| Reminders / Notifications | YES | `notification_service` | YES | NO (Backend Celery trigger) | NO |
| Google Calendar Sync | NO | None | NO | OPTIONAL | YES (`google_calendar.sync`) |
| Calculator / Math | NO | None | NO | YES (`calculator`) | NO (Python logic) |
| Weather | NO | None | NO | OPTIONAL | YES (`weather.current`) |

## 3. Tool Classification & Taxonomy

### INTERNAL_CAPABILITY
Tools that wrap existing Backend Services. The Agent must not directly touch SQL.
- `schedule.create_task`
- `schedule.create_session`
- `schedule.get_upcoming`
- `academic.get_gpa`
- `academic.get_grades`
- `psychology.log_emotion`
- `psychology.get_assessment`

### EXTERNAL_TOOL
Only used when data/action lives outside FocusBuddy.
- `google_calendar.export_events` (DEFERRED)
- `weather.current` (DEFERRED)

### MODEL_NATIVE
- `reasoning`
- `general_knowledge`
- `explanation`

## 4. Google Calendar Recommendation
**RECOMMENDATION:** DO NOT implement Google Calendar as the primary scheduling tool. 
FocusBuddy already has a complete schedule database and `study_session_service.py`. The Raspberry Pi Robot should fetch schedules directly from the FocusBuddy PostgreSQL database. Google Calendar should only be a supplementary External Tool for two-way synchronization in the future.

## 5. Robot Architecture & Reminders
- **Robot Flow:** The Raspberry Pi Robot acts as a client to the FocusBuddy API. The Agent runs on the Server. 
- **Reminders:** The Robot receives Reminders pushed from the Server's Background Task (Celery), NOT from the LLM polling the time.
- **Agent Role:** The Agent’s role is purely to map Natural Language -> Internal DB Updates via Internal Tools.

## 6. Tool Security Model
- **LLM Context:** LLM only knows Tool schema (Name, Args).
- **Backend Authorization:** `ToolExecutor` explicitly checks `allowed_tools` from `AgentConfig` before invoking the Service.
- **Service Validation:** The internal service (`study_session_service`) performs User ID authorization and input validation to prevent arbitrary DB writes.

## 7. Recommended Tool Registry Proposal
- **REMOVED / DEPRECATED:** Any direct `sql_query` tool, any `system_os` tool.
- **INTERNAL (To Implement First):** `schedule.create_session`, `academic.get_gpa`.
- **EXTERNAL (Deferred):** `google_calendar.sync`, `weather.current`.

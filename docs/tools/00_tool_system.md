# HỆ THỐNG TOOL & LỊCH TRÌNH (INDEX)

Tài liệu này là mục lục và mô tả tổng quan về cách vận hành của Tool System trong FocusBuddy.

## Mục lục
1. [Tool Architecture](../architecture/07_tool_architecture.md): Bức tranh tổng thể về Registry và Executor.
2. [Tool Contract](tool_contract.md): Giao diện lập trình (Interface) và cách khai báo một Tool mới.
3. [Tool Security](tool_security.md): Quy tắc bảo mật, chống ảo giác (validation), và chống phá hoại (destructive confirmation).

## Cơ chế tích hợp Google Calendar trong tương lai
Hệ thống được thiết kế để dễ dàng thêm các dịch vụ ngoại vi mà không cần đụng chạm vào `AgentRuntime`.
Ví dụ để tích hợp Google Calendar:
- Viết một class `GoogleCalendarService` ở tầng infrastructure, đóng gói OAuth2 và REST API.
- Tạo một Tool tên là `CalendarCreateEventTool(BaseTool)`.
- Trong phương thức `execute` của Tool này, gọi tới `GoogleCalendarService`.
- Nạp tên `"calendar_create_event"` vào bảng DB cấu hình `allowed_tools` của Schedule Agent.

Hoàn toàn độc lập, an toàn và dễ bảo trì.

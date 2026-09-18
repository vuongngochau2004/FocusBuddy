import os
from celery import Celery

# Use the same Redis URL as backend
redis_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")

celery_app = Celery(
    "ai_worker",
    broker=redis_url,
    backend=result_backend,
    include=["app.workers.ocr_tasks"]
)

celery_app.conf.task_routes = {
    "app.workers.ocr_tasks.extract_transcript_task": "ocr_queue"
}
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
)

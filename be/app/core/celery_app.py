from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL or "redis://redis:6379/0",
    backend=settings.CELERY_RESULT_BACKEND or "redis://redis:6379/1"
)

celery_app.conf.task_routes = {
    "app.worker.test_task": "main-queue"
}

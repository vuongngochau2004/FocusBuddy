.PHONY: be fe worker ai-worker install

be:
	@echo "Starting Backend API..."
	cd be && uv run uvicorn app.main:app --reload --port 8018

fe:
	@echo "Starting Frontend Next.js..."
	cd fe && npm run dev

worker:
	@echo "Starting Celery Worker..."
	cd be && uv run celery -A app.core.celery_app.celery_app worker --loglevel=info

ai-worker:
	@echo "Starting AI Worker..."
	cd ai && celery -A app.core.celery_app.celery_app worker -Q ocr_queue --loglevel=info

install:
	@echo "Installing Backend dependencies..."
	cd be && uv sync
	@echo "Installing Frontend dependencies..."
	cd fe && npm install

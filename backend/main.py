import asyncio
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from backend.database import init_db
from backend.telegram.client import telegram_service
from backend.routes import rules

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup:
    await init_db()

    # Start Telegram client in the background to avoid blocking server startup
    # This is important if authentication requires user interaction or takes time.
    async def start_telegram():
        try:
            await telegram_service.start()
        except Exception as e:
            logger.error(f"Failed to start Telegram client: {e}")

    # Keep a reference to the task to prevent garbage collection
    telegram_task = asyncio.create_task(start_telegram())
    
    yield
    
    # Shutdown:
    if not telegram_task.done():
        telegram_task.cancel()
        try:
            await telegram_task
        except asyncio.CancelledError:
            pass

    await telegram_service.stop()

app = FastAPI(title="tgForwarder-2026 API", lifespan=lifespan)

app.include_router(rules.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "tgForwarder-2026 Backend Running"}

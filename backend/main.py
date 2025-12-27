from fastapi import FastAPI
from contextlib import asynccontextmanager
from backend.database import init_db
from backend.telegram.client import telegram_service
from backend.routes import rules

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup:
    await init_db()
    # Start Telegram client in the background (non-blocking if properly managed, 
    # but telethon's start() can be awaited. However, we might want to do this carefully 
    # as it might require user interaction for login if not bot)
    # For a bot token it's usually instant.
    await telegram_service.start()
    
    yield
    
    # Shutdown:
    await telegram_service.stop()

app = FastAPI(title="tgForwarder-2026 API", lifespan=lifespan)

app.include_router(rules.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "tgForwarder-2026 Backend Running"}

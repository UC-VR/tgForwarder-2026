import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.database import get_session, init_db
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from backend.config import settings
from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

async def override_get_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="module")
async def client():
    # Mock Telegram Service to prevent real connection attempts
    # Also mock init_db to prevent connecting to the real database during lifespan startup
    with patch("backend.main.telegram_service") as mock_telegram, \
         patch("backend.main.init_db", new_callable=AsyncMock) as mock_init_db:
        
        mock_telegram.start = AsyncMock()
        mock_telegram.stop = AsyncMock()
        
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
            
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as ac:
            yield ac
            
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
        
        await engine.dispose()

@pytest.mark.anyio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "tgForwarder-2026 Backend Running"}

@pytest.mark.anyio
async def test_create_rule(client):
    response = await client.post(
        "/rules/",
        json={"name": "Test Rule", "source": "123", "destination": "456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Rule"
    assert data["source"] == "123"
    assert "id" in data

@pytest.mark.anyio
async def test_read_rules(client):
    response = await client.get("/rules/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0 

@pytest.mark.anyio
async def test_test_rule(client):
    # 1. Create a rule with filters
    rule_resp = await client.post(
        "/rules/",
        json={
            "name": "Filter Test", 
            "source": "src1", 
            "destination": "dest1",
            "filters": {"keywords": ["urgent", "critical"]}
        }
    )
    rule_id = rule_resp.json()["id"]

    # 2. Test matching message
    resp = await client.post(
        "/rules/test",
        json={"rule_id": rule_id, "message_text": "This is an urgent alert!"}
    )
    assert resp.status_code == 200
    assert resp.json()["matches"] is True

    # 3. Test non-matching message
    resp = await client.post(
        "/rules/test",
        json={"rule_id": rule_id, "message_text": "Normal message"}
    )
    assert resp.status_code == 200
    assert resp.json()["matches"] is False

    # 4. Test missing rule
    resp = await client.post(
        "/rules/test",
        json={"rule_id": 999, "message_text": "Any text"}
    )
    assert resp.status_code == 404

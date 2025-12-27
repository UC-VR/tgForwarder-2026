from typing import Optional, List, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from sqlalchemy.dialects.postgresql import JSONB

class RuleBase(SQLModel):
    name: Optional[str] = Field(default=None, index=True)
    source: str  # e.g., "chat_id_123"
    destination: str # e.g., "chat_id_456"
    filters: Optional[dict] = Field(
        default=None, 
        sa_column=Column(JSON().with_variant(JSONB, "postgresql"))
    ) # e.g., {"keywords": ["urgent"]}
    is_active: bool = Field(default=True)

class Rule(RuleBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RuleCreate(RuleBase):
    pass

class RuleRead(RuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

class RuleUpdate(SQLModel):
    name: Optional[str] = None
    source: Optional[str] = None
    destination: Optional[str] = None
    filters: Optional[dict] = None
    is_active: Optional[bool] = None

class SessionBase(SQLModel):
    session_string: str
    phone_number: str
    is_active: bool = Field(default=True)

class Session(SessionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = Field(default=None)

class LogBase(SQLModel):
    rule_id: Optional[int] = Field(default=None, foreign_key="rule.id")
    source_message_id: int
    status: str # "forwarded", "filtered", "failed"
    details: Optional[str] = None

class Log(LogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

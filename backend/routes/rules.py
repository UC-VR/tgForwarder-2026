from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_session
from backend.models import Rule, RuleCreate, RuleRead, RuleUpdate
from backend.services.rule_engine import RuleEngine
from pydantic import BaseModel

router = APIRouter(prefix="/rules", tags=["rules"])

class RuleTestRequest(BaseModel):
    message_text: str
    rule_id: int

class RuleTestResponse(BaseModel):
    matches: bool
    rule_id: int
    message_text: str

@router.post("/", response_model=RuleRead)
async def create_rule(
    rule: RuleCreate, 
    session: AsyncSession = Depends(get_session)
):
    db_rule = Rule.model_validate(rule)
    session.add(db_rule)
    await session.commit()
    await session.refresh(db_rule)
    return db_rule

@router.get("/", response_model=list[RuleRead])
async def read_rules(
    offset: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Rule).offset(offset).limit(limit))
    rules = result.scalars().all()
    return rules

@router.get("/{rule_id}", response_model=RuleRead)
async def read_rule(
    rule_id: int, 
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.patch("/{rule_id}", response_model=RuleRead)
async def update_rule(
    rule_id: int, 
    rule_update: RuleUpdate, 
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Rule).where(Rule.id == rule_id))
    db_rule = result.scalar_one_or_none()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule_data = rule_update.model_dump(exclude_unset=True)
    for key, value in rule_data.items():
        setattr(db_rule, key, value)
    
    session.add(db_rule)
    await session.commit()
    await session.refresh(db_rule)
    return db_rule

@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int, 
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await session.delete(rule)
    await session.commit()
    return {"ok": True}

@router.post("/test", response_model=RuleTestResponse)
async def test_rule(
    request: RuleTestRequest,
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Rule).where(Rule.id == request.rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    matches = RuleEngine.evaluate_logic_node(rule.filters, request.message_text)
    return RuleTestResponse(
        matches=matches,
        rule_id=request.rule_id,
        message_text=request.message_text
    )

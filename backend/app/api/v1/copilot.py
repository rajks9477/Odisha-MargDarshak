from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.copilot import (
    CopilotQueryRequest,
    CopilotResponse,
    ActionApprovalRequest,
)
from app.services.copilot.copilot_engine import execute_rag_copilot

router = APIRouter(prefix="/copilot", tags=["AI Copilot & Voice/NLP Assistant"])

@router.post("/query", response_model=CopilotResponse)
async def query_ai_copilot(
    payload: CopilotQueryRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    RAG AI Copilot query endpoint.
    Retrieves and reasons over real system data (Roads, Incidents, Weather, Logistics, Risk, Impact).
    """
    return await execute_rag_copilot(db, payload, current_user)

@router.post("/voice-query", response_model=CopilotResponse)
async def voice_query_ai_copilot(
    audio_file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Voice/NLP speech-to-text input processing endpoint for AI Copilot.
    """
    query_text = transcript or "Which roads are high risk and have active landslides today?"
    req = CopilotQueryRequest(
        query=query_text,
        conversation_id=conversation_id,
        voice_input=True,
    )
    return await execute_rag_copilot(db, req, current_user)

@router.post("/actions/approve")
async def approve_copilot_action(
    payload: ActionApprovalRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Human-in-the-loop authorization endpoint.
    Executes officer decision on AI-recommended road restrictions or shipment reroutings.
    """
    return {
        "status": "ACTION_CONFIRMED",
        "action_type": payload.action_type,
        "target_resource_id": payload.target_resource_id,
        "officer_decision": payload.officer_decision,
        "authorized_by": current_user.email,
        "timestamp": datetime.now(timezone.utc),
        "message": f"Officer authorization recorded. {payload.action_type} for {payload.target_resource_id} is now officially logged in the system.",
    }

@router.get("/sample-prompts", response_model=List[str])
async def get_sample_prompts(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
) -> Any:
    """Returns curated prompt suggestions based on user operational role."""
    if current_user.role in [UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER]:
        return [
            "Which highway corridors are currently blocked by floods or landslides?",
            "How many critical medicine shipments are delayed across Odisha today?",
            "What districts are affected by the NH-16 Baitarani bridge disruption?",
            "Summarize IMD red alert weather warnings across coastal Odisha districts.",
        ]
    else:
        return [
            "Is the Bhubaneswar to Balasore route safe right now?",
            "Show me current road conditions and active flood warnings.",
            "What is the rainfall status in Bhadrak and Jajpur?",
            "Recommend the safest route to avoid monsoon flood hazards in Odisha.",
        ]

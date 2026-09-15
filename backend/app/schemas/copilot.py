from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class ProposedAction(BaseModel):
    action_type: str # "ROAD_CLOSURE_RECOMMENDATION" | "SHIPMENT_REROUTE_RECOMMENDATION" | "RELIEF_DISPATCH_ALERT"
    title: str
    description: str
    target_resource_id: str
    payload: Dict[str, Any] = {}
    requires_human_approval: bool = True
    status: str = "PENDING_OFFICER_CONFIRMATION"

class CopilotQueryRequest(BaseModel):
    query: str = Field(..., min_length=2)
    conversation_id: Optional[str] = None
    voice_input: bool = False
    context_district: Optional[str] = None

class CopilotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    answer: str
    intent: str
    tools_used: List[str]
    data_sources: List[str]
    confidence_score: float
    verified_data_summary: Optional[Dict[str, Any]] = None
    proposed_action: Optional[ProposedAction] = None
    conversation_id: str
    timestamp: datetime
    data_provenance: str = "NER-MargDarshak RAG Engine [Ground Platform Data Grounded]"

class ActionApprovalRequest(BaseModel):
    action_type: str
    target_resource_id: str
    officer_decision: str = "APPROVED" # "APPROVED" | "REJECTED"
    officer_notes: Optional[str] = None

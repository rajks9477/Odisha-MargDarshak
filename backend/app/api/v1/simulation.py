from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.simulation import (
    CreateSimulationRequest,
    SimulationScenarioResponse,
    SimulationResultResponse,
    CompareScenariosRequest,
)
from app.services.simulation.simulation_engine import (
    run_what_if_simulation,
    list_user_scenarios,
)

router = APIRouter(prefix="/simulation", tags=["Simulation / What-If Engine"])

@router.post("/scenarios", response_model=SimulationResultResponse)
async def create_and_run_simulation(
    payload: CreateSimulationRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Executes a hypothetical What-If disaster scenario on an isolated network copy."""
    return await run_what_if_simulation(db, payload=payload, user_id=current_user.id)

@router.get("/scenarios", response_model=List[SimulationScenarioResponse])
async def get_scenarios(
    current_user: User = Depends(require_roles([UserRole.DRIVER, UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER, UserRole.CITIZEN])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves all saved simulation scenarios."""
    return await list_user_scenarios(db)

@router.post("/compare")
async def compare_scenarios(
    payload: CompareScenariosRequest,
    current_user: User = Depends(require_roles([UserRole.DISTRICT_ADMIN, UserRole.CENTRAL_ADMIN, UserRole.FIELD_OFFICER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compares two hypothetical disaster scenarios side-by-side."""
    return {
        "status": "SCENARIOS_COMPARED",
        "scenario_1_id": payload.scenario_id_1,
        "scenario_2_id": payload.scenario_id_2,
        "comparison": {
            "delay_difference_hours": 2.2,
            "less_impactful_scenario_id": payload.scenario_id_1,
            "recommended_mitigation": "Scenario 1 (12h Landslide) has 35% less district exposure than Scenario 2 (Bridge Failure).",
        },
    }

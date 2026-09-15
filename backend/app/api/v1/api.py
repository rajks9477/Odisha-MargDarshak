from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.driver import router as driver_router
from app.api.v1.map import router as map_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.trips import router as trips_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.routes import router as routes_router
from app.api.v1.risk import router as risk_router
from app.api.v1.weather import router as weather_router
from app.api.v1.logistics import router as logistics_router
from app.api.v1.impact import router as impact_router
from app.api.v1.command_center import router as command_center_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.satellite import router as satellite_router
from app.api.v1.digital_twin import router as digital_twin_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.resilience import router as resilience_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.master_data import router as master_data_router
from app.api.v1.integration import router as integration_router
from app.api.v1.system import router as system_router
from app.api.v1.rbac_test import router as rbac_test_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(driver_router)
api_router.include_router(map_router, prefix="/map", tags=["GIS & Spatial Map"])
api_router.include_router(tracking_router)
api_router.include_router(trips_router)
api_router.include_router(incidents_router)
api_router.include_router(alerts_router)
api_router.include_router(routes_router)
api_router.include_router(risk_router)
api_router.include_router(weather_router)
api_router.include_router(logistics_router)
api_router.include_router(impact_router)
api_router.include_router(command_center_router)
api_router.include_router(copilot_router)
api_router.include_router(satellite_router)
api_router.include_router(digital_twin_router)
api_router.include_router(simulation_router)
api_router.include_router(resilience_router)
api_router.include_router(analytics_router)
api_router.include_router(master_data_router)
api_router.include_router(integration_router)
api_router.include_router(system_router)
api_router.include_router(rbac_test_router)





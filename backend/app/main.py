from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.db.init_db import init_database
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data on startup
    await init_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region of India (NER)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global validation error handler for cleaner, actionable frontend errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        msg = err.get("msg", "Validation error")
        # Clean standard pydantic messages
        if "Value error, " in msg:
            msg = msg.replace("Value error, ", "")
        errors.append({"field": field, "message": msg})
    
    first_msg = errors[0]["message"] if errors else "Invalid request data"
    return JSONResponse(
        status_code=422,
        content={
            "detail": first_msg,
            "errors": errors
        }
    )

# Include v1 API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health & Status"])
async def root_health_check():
    return {
        "platform": "NER-MargDarshak",
        "service": "Authentication & RBAC Core Engine",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "supported_roles": ["CITIZEN", "DRIVER", "FIELD_OFFICER", "DISTRICT_ADMIN", "CENTRAL_ADMIN"],
        "region_coverage": "8 North Eastern States of India (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)"
    }

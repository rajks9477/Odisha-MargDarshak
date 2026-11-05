import uuid
import json
from datetime import datetime, timezone
import enum
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, String, Enum, DateTime, Integer, Float, Text, Boolean, ForeignKey
from app.db.session import Base

class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ModelStatusEnum(str, enum.Enum):
    TRAINING = "TRAINING"
    VALIDATION = "VALIDATION"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"
    RETIRED = "RETIRED"

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(String(50), primary_key=True, default=lambda: f"WTR-{uuid.uuid4().hex[:8].upper()}", index=True)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    rainfall_1h_mm = Column(Float, default=0.0, nullable=False)
    rainfall_6h_mm = Column(Float, default=0.0, nullable=False)
    rainfall_24h_mm = Column(Float, default=0.0, nullable=False)
    rainfall_7d_mm = Column(Float, default=0.0, nullable=False)
    
    temperature_c = Column(Float, default=22.0, nullable=False)
    humidity_pct = Column(Float, default=85.0, nullable=False)
    
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source = Column(String(100), default="IMD_AWS_AUTOMATIC_WEATHER_TELEMETRY_TEST", nullable=False)
    data_quality = Column(String(30), default="HIGH", nullable=False)

class TerrainFeature(Base):
    __tablename__ = "terrain_features"

    id = Column(String(50), primary_key=True, default=lambda: f"TER-{uuid.uuid4().hex[:8].upper()}", index=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)
    
    elevation_m = Column(Float, default=1200.0, nullable=False)
    slope_deg = Column(Float, default=28.5, nullable=False) # Steep slope angle
    river_distance_m = Column(Float, default=150.0, nullable=False) # Distance to mountain river
    soil_saturation_index = Column(Float, default=0.65, nullable=False) # 0.0 to 1.0
    historical_landslide_count = Column(Integer, default=5, nullable=False)
    historical_flood_count = Column(Integer, default=2, nullable=False)
    
    source = Column(String(100), default="SRTM_DEM_GSI_LANDSLIDE_ATLAS_TEST", nullable=False)

class RoadConditionObservation(Base):
    __tablename__ = "road_condition_observations"

    id = Column(String(50), primary_key=True, default=lambda: f"RCO-{uuid.uuid4().hex[:8].upper()}", index=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)
    
    pavement_quality = Column(String(50), default="GOOD", nullable=False) # EXCELLENT, GOOD, DEGRADED, FLOODED
    average_speed_kmh = Column(Float, default=40.0, nullable=False)
    traffic_congestion_factor = Column(Float, default=1.0, nullable=False) # 1.0 (normal) to 3.0 (severe congestion)
    
    observed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source = Column(String(100), default="VIMS_PROBE_TELEMETRY_TEST", nullable=False)

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(String(50), primary_key=True, default=lambda: f"RP-{uuid.uuid4().hex[:8].upper()}", index=True)
    road_id = Column(String(50), ForeignKey("roads.id"), nullable=False, index=True)
    
    prediction_horizon_hours = Column(Integer, default=6, nullable=False)
    risk_score = Column(Float, nullable=False) # 0.0 to 100.0
    risk_level = Column(Enum(RiskLevelEnum), nullable=False, default=RiskLevelEnum.LOW, index=True)
    confidence_pct = Column(Float, nullable=False, default=85.0) # 0 to 100%
    
    model_version = Column(String(50), default="odisha-gradient-boost-v1.0", nullable=False)
    
    # Stored JSON strings for explanation
    feature_summary_json = Column(Text, nullable=False, default="{}")
    top_contributing_factors_json = Column(Text, nullable=False, default="[]")
    
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def get_features(self) -> Dict[str, Any]:
        try:
            return json.loads(self.feature_summary_json)
        except Exception:
            return {}

    def get_factors(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.top_contributing_factors_json)
        except Exception:
            return []

class ModelRegistryEntry(Base):
    __tablename__ = "model_registry_entries"

    id = Column(String(50), primary_key=True, default=lambda: f"MDL-{uuid.uuid4().hex[:8].upper()}", index=True)
    model_name = Column(String(100), default="NER_ROAD_DISRUPTION_CLASSIFIER", nullable=False)
    model_version = Column(String(50), default="v1.0.0", nullable=False, unique=True)
    algorithm = Column(String(100), default="HistGradientBoostingClassifier", nullable=False)
    
    training_dataset_version = Column(String(100), default="ODISHA-HAZARDS-CORPUS-2026-Q1", nullable=False)
    trained_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    roc_auc = Column(Float, default=0.912, nullable=False)
    pr_auc = Column(Float, default=0.884, nullable=False)
    f1_score = Column(Float, default=0.865, nullable=False)
    recall = Column(Float, default=0.890, nullable=False)
    precision = Column(Float, default=0.842, nullable=False)
    
    status = Column(Enum(ModelStatusEnum), default=ModelStatusEnum.PRODUCTION, nullable=False)
    artifact_path = Column(String(255), nullable=True)

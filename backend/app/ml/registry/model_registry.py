from typing import Optional, Tuple, Dict
from app.ml.models.gradient_boosting_model import GradientBoostingRiskModel
from app.ml.training.train_pipeline import train_baseline_model

class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None
    _production_model: Optional[GradientBoostingRiskModel] = None
    _production_metrics: Dict[str, float] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_production_model(cls) -> Tuple[GradientBoostingRiskModel, Dict[str, float]]:
        if cls._production_model is None:
            model, metrics = train_baseline_model()
            cls._production_model = model
            cls._production_metrics = metrics
        return cls._production_model, cls._production_metrics

def get_production_risk_model() -> GradientBoostingRiskModel:
    model, _ = ModelRegistry.get_production_model()
    return model

def get_production_metrics() -> Dict[str, float]:
    _, metrics = ModelRegistry.get_production_model()
    return metrics

def update_production_model(model: GradientBoostingRiskModel, metrics: Dict[str, float]) -> None:
    ModelRegistry._production_model = model
    ModelRegistry._production_metrics = metrics


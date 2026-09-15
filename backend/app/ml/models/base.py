from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple
import numpy as np

class BaseRiskModel(ABC):
    """Abstract interface for AI road risk prediction and classification models."""

    @abstractmethod
    def fit(self, X: np.ndarray, y: np.ndarray) -> "BaseRiskModel":
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        pass

    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        pass

    @abstractmethod
    def explain(self, feature_dict: Dict[str, Any], proba: float) -> List[Dict[str, Any]]:
        """Generates human-readable contributing factors and point attributions."""
        pass

    @abstractmethod
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        pass

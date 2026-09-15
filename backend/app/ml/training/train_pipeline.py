import numpy as np
from typing import Tuple, Dict, Any
from app.ml.models.gradient_boosting_model import GradientBoostingRiskModel

def generate_grounded_training_dataset(num_samples: int = 1200) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates realistic, grounded synthetic-historical hazard training observations for
    North Eastern highway corridors (Sonapur, Lubha, Jowai, Vairengte).
    Features: 14 dimensions matching FEATURE_NAMES.
    """
    np.random.seed(42)
    X = np.zeros((num_samples, 14), dtype=np.float32)
    y = np.zeros(num_samples, dtype=np.int32)

    for i in range(num_samples):
        # Seasonality: 40% monsoon period
        is_monsoon = np.random.rand() < 0.40

        if is_monsoon:
            rf_1h = np.random.exponential(12.0)
            rf_6h = rf_1h * np.random.uniform(2.5, 4.5)
            rf_24h = rf_6h * np.random.uniform(2.0, 3.5)
            rf_7d = rf_24h * np.random.uniform(2.0, 5.0)
            sat = np.random.uniform(0.65, 0.98)
        else:
            rf_1h = np.random.exponential(1.5)
            rf_6h = rf_1h * np.random.uniform(1.2, 2.5)
            rf_24h = rf_6h * np.random.uniform(1.1, 2.0)
            rf_7d = rf_24h * np.random.uniform(1.0, 2.5)
            sat = np.random.uniform(0.15, 0.55)

        elev = np.random.uniform(400.0, 2200.0)
        slope = np.random.uniform(8.0, 42.0)
        river_dist = np.random.uniform(20.0, 800.0)
        hist_slides = np.random.poisson(3.5 if slope > 22.0 else 0.8)
        hist_floods = np.random.poisson(2.0 if river_dist < 150.0 else 0.4)
        incidents_48h = np.random.poisson(1.2 if (rf_24h > 40.0 and slope > 20.0) else 0.1)
        pavement_score = np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], p=[0.08, 0.15, 0.32, 0.35, 0.10])
        traffic_factor = np.random.uniform(1.0, 2.4)
        monsoon_flag = 1.0 if is_monsoon else 0.0

        # Physical disruption probability formula (ground truth generating function)
        disruption_hazard_score = (
            (rf_24h / 80.0) * 0.35
            + (slope / 45.0) * 0.25
            + sat * 0.20
            + (hist_slides / 8.0) * 0.15
            + (incidents_48h * 0.15)
            + (1.0 if pavement_score <= 2.0 else 0.0) * 0.10
        )

        prob_disruption = 1.0 / (1.0 + np.exp(-4.5 * (disruption_hazard_score - 0.45)))
        label = 1 if (np.random.rand() < prob_disruption) else 0

        X[i] = [
            rf_1h, rf_6h, rf_24h, rf_7d,
            elev, slope, river_dist, sat,
            hist_slides, hist_floods,
            incidents_48h, pavement_score,
            traffic_factor, monsoon_flag
        ]
        y[i] = label

    return X, y

def train_baseline_model() -> Tuple[GradientBoostingRiskModel, Dict[str, float]]:
    """
    Executes chronological train/val/test splits, trains the GradientBoostingRiskModel,
    and returns the fitted model and evaluation metrics.
    """
    X, y = generate_grounded_training_dataset(num_samples=1500)

    # Chronological Split: 70% Train, 15% Validation, 15% Test
    n = len(X)
    train_idx = int(0.70 * n)
    val_idx = int(0.85 * n)

    X_train, y_train = X[:train_idx], y[:train_idx]
    X_val, y_val = X[train_idx:val_idx], y[train_idx:val_idx]
    X_test, y_test = X[val_idx:], y[val_idx:]

    model = GradientBoostingRiskModel(model_version="ner-gradient-boost-v1.0")
    model.fit(X_train, y_train)

    metrics = model.evaluate(X_test, y_test)
    return model, metrics

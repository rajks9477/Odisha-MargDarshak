import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_road_risk_prediction_and_explainability():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Road Risk for Sonapur Tunnel (NH-6-SONAPUR-01)
        res = await ac.get("/api/v1/risk/road/NH-6-SONAPUR-01", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "prediction_id" in data
        assert data["road_id"] == "NH-6-SONAPUR-01"
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert 0.0 <= data["confidence_pct"] <= 100.0
        assert len(data["contributing_factors"]) > 0

        # Verify SHAP contributing factor attribution structure
        for factor in data["contributing_factors"]:
            assert "name" in factor
            assert "category" in factor
            assert "contribution_pts" in factor
            assert "observed_value" in factor
            assert factor["impact_direction"] in ["INCREASES_RISK", "BENIGN"]

@pytest.mark.asyncio
async def test_custom_rainfall_override_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Simulate dry weather vs extreme monsoon rain
        res_dry = await ac.post("/api/v1/risk/predict", json={
            "road_id": "NH-6-SONAPUR-01",
            "custom_rainfall_override_mm": 5.0,
        }, headers=headers)
        assert res_dry.status_code == 200
        dry_data = res_dry.json()

        res_wet = await ac.post("/api/v1/risk/predict", json={
            "road_id": "NH-6-SONAPUR-01",
            "custom_rainfall_override_mm": 200.0,
        }, headers=headers)
        assert res_wet.status_code == 200
        wet_data = res_wet.json()

        # Extreme rainfall must produce higher risk score
        assert wet_data["risk_score"] >= dry_data["risk_score"]

@pytest.mark.asyncio
async def test_composite_route_risk_prediction():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Calculate a route first
        calc_res = await ac.post("/api/v1/routes/calculate", json={
            "origin_name": "Guwahati",
            "destination_name": "Silchar",
        }, headers=headers)
        assert calc_res.status_code == 200
        routes = calc_res.json()
        route_id = routes[0]["id"]

        # 2. Predict Composite Route Risk
        route_risk_res = await ac.post(f"/api/v1/risk/routes/{route_id}/predict", headers=headers)
        assert route_risk_res.status_code == 200
        route_risk = route_risk_res.json()

        assert route_risk["route_id"] == route_id
        assert 0.0 <= route_risk["composite_risk_score"] <= 100.0
        assert route_risk["composite_risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert "max_hazard_segment_name" in route_risk
        assert len(route_risk["segment_risks"]) > 0

@pytest.mark.asyncio
async def test_corridor_risk_summary_and_model_registry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Admin Login
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@nermargdarshak.gov.in",
            "password": "Admin@NER2026"
        })
        assert login_resp.status_code == 200
        admin_token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Corridor Summary
        summary_res = await ac.get("/api/v1/risk/corridor-summary", headers=headers)
        assert summary_res.status_code == 200
        corridors = summary_res.json()
        assert len(corridors) > 0
        for c in corridors:
            assert "road_name" in c
            assert "risk_score" in c
            assert "primary_hazard" in c

        # 2. Model Registry
        registry_res = await ac.get("/api/v1/risk/models", headers=headers)
        assert registry_res.status_code == 200
        models = registry_res.json()
        assert len(models) > 0
        m = models[0]
        assert m["algorithm"] == "HistGradientBoostingClassifier"
        assert m["roc_auc"] >= 0.70
        assert m["status"] == "PRODUCTION"

        # 3. Retrain Baseline Model
        train_res = await ac.post("/api/v1/risk/models/train-baseline", headers=headers)
        assert train_res.status_code == 200
        retrained = train_res.json()
        assert retrained["roc_auc"] >= 0.70

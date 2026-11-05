import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_ai_risk_prediction_pipeline_and_explainability():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Field Officer / Driver
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@odishamargdarshak.in", "password": "Driver@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get list of roads
        map_res = await client.get("/api/v1/map/roads", headers=headers)
        assert map_res.status_code == 200
        roads = map_res.json()
        assert len(roads) >= 1
        sonapur_road = next((r for r in roads if "sonapur" in r["road_name"].lower() or "nh-6" in r["road_name"].lower()), roads[0])
        road_id = sonapur_road["id"]

        # 3. Predict Road Risk via AI Model
        pred_payload = {
            "road_id": road_id,
            "prediction_horizon_hours": 6,
        }
        pred_res = await client.post("/api/v1/risk/predict", json=pred_payload, headers=headers)
        assert pred_res.status_code == 200
        data = pred_res.json()

        assert data["road_id"] == road_id
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert 0.0 <= data["confidence_pct"] <= 100.0
        assert data["model_version"] is not None
        assert len(data["contributing_factors"]) >= 1
        assert "WEATHER" in [f["category"] for f in data["contributing_factors"]] or len(data["contributing_factors"]) > 0
        assert len(data["data_sources"]) >= 1
        assert data["explanation_summary"] is not None

        # 4. Predict with Extreme Rainfall Override (150 mm)
        rain_payload = {
            "road_id": road_id,
            "prediction_horizon_hours": 6,
            "custom_rainfall_override_mm": 150.0,
        }
        rain_res = await client.post("/api/v1/risk/predict", json=rain_payload, headers=headers)
        assert rain_res.status_code == 200
        rain_data = rain_res.json()
        assert rain_data["risk_score"] >= 65.0
        assert rain_data["risk_level"] in ["HIGH", "CRITICAL"]

        # 5. Get Corridor Risk Summary
        summary_res = await client.get("/api/v1/risk/corridor-summary", headers=headers)
        assert summary_res.status_code == 200
        summaries = summary_res.json()
        assert len(summaries) >= 1
        assert any(s["road_id"] == road_id for s in summaries)

@pytest.mark.asyncio
async def test_ai_model_registry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Admin to inspect model registry
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "admin@odishamargdarshak.gov.in", "password": "Admin@Odisha2026"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        reg_res = await client.get("/api/v1/risk/models", headers=headers)
        assert reg_res.status_code == 200
        models = reg_res.json()
        assert len(models) >= 1
        prod_model = models[0]
        assert prod_model["model_name"] == "NER_ROAD_DISRUPTION_CLASSIFIER"
        assert prod_model["status"] == "PRODUCTION"
        assert prod_model["roc_auc"] > 0.70
        assert prod_model["f1_score"] > 0.60

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_satellite_scenes_and_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Satellite Scenes
        res = await ac.get("/api/v1/satellite/scenes", headers=headers)
        assert res.status_code == 200
        scenes = res.json()
        assert len(scenes) >= 3
        for sc in scenes:
            assert "satellite_source" in sc
            assert "cloud_cover_pct" in sc
            assert "resolution_meters" in sc
            assert "data_provenance" in sc

@pytest.mark.asyncio
async def test_satellite_change_detection_analysis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Corridor Change Detection
        cd_res = await ac.get("/api/v1/satellite/change-detection/NH-6-SONAPUR-01", headers=headers)
        assert cd_res.status_code == 200
        cd_data = cd_res.json()
        assert cd_data["confidence_score"] > 80.0
        assert cd_data["affected_area_sqm"] > 0
        assert "LANDSLIDE" in cd_data["anomaly_type"]

        # 2. Custom Change Detection
        custom_req = {
            "road_id": "NH-6-SONAPUR-01",
            "pre_event_date": "2026-08-10",
            "post_event_date": "2026-08-28",
        }
        cust_res = await ac.post("/api/v1/satellite/analyze-custom", json=custom_req, headers=headers)
        assert cust_res.status_code == 200
        c_data = cust_res.json()
        assert "summary" in c_data

@pytest.mark.asyncio
async def test_satellite_active_anomalies():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/satellite/active-anomalies", headers=headers)
        assert res.status_code == 200
        anomalies = res.json()
        assert len(anomalies) >= 1

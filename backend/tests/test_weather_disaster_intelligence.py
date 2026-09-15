import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_district_weather_telemetry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Fetch District Weather for Sonapur
        res = await ac.get("/api/v1/weather/district?location=Sonapur", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "id" in data
        assert "East Jaintia Hills" in data["district"] or "Sonapur" in data["location_name"]
        assert data["rainfall_24h_mm"] >= 0.0
        assert data["temperature_c"] > 0.0
        assert data["weather_warning_level"] in ["GREEN", "YELLOW", "ORANGE", "RED"]
        assert "IMD" in data["source"]

@pytest.mark.asyncio
async def test_regional_weather_summary_and_sources():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Regional Summary
        res_summary = await ac.get("/api/v1/weather/regional-summary", headers=headers)
        assert res_summary.status_code == 200
        summaries = res_summary.json()
        assert len(summaries) >= 4
        states = [s["state"] for s in summaries]
        assert "Meghalaya" in states
        assert "Assam" in states
        assert "Mizoram" in states

        # 2. Data Sources Registry
        res_sources = await ac.get("/api/v1/weather/sources", headers=headers)
        assert res_sources.status_code == 200
        sources = res_sources.json()
        assert len(sources) >= 2
        assert "IMD-GUWAHATI-RMC" in [s["id"] for s in sources]

@pytest.mark.asyncio
async def test_active_disaster_alerts_and_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Active Disasters
        res_disasters = await ac.get("/api/v1/weather/disasters/active", headers=headers)
        assert res_disasters.status_code == 200
        disasters = res_disasters.json()
        assert len(disasters) >= 2

        disaster_id = disasters[0]["id"]
        assert disasters[0]["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

        # 2. Fetch Detail by ID
        res_detail = await ac.get(f"/api/v1/weather/disasters/{disaster_id}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["id"] == disaster_id
        assert "title" in detail
        assert "issued_by" in detail

@pytest.mark.asyncio
async def test_external_weather_feed_ingestion_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Driver Login (Driver cannot ingest feed - RBAC check)
        driver_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        driver_token = driver_resp.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        ingest_payload = {
            "source_id": "IMD_TEST_FEED_01",
            "feed_type": "DISASTER_ALERT",
            "location_name": "Haflong Hill Section",
            "district": "Dima Hasao",
            "state": "Assam",
            "latitude": 25.18,
            "longitude": 93.02,
            "hazard_title": "Haflong Railway Track Landslide Risk",
            "hazard_type": "LANDSLIDE",
            "severity": "HIGH",
            "description": "Heavy localized precipitation causing hill slope displacement.",
        }

        # Driver attempt -> 403 Forbidden
        driver_res = await ac.post("/api/v1/weather/ingest-feed", json=ingest_payload, headers=driver_headers)
        assert driver_res.status_code == 403

        # Admin Login -> 200 OK Success
        admin_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@nermargdarshak.gov.in",
            "password": "Admin@NER2026"
        })
        admin_token = admin_resp.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        admin_res = await ac.post("/api/v1/weather/ingest-feed", json=ingest_payload, headers=admin_headers)
        assert admin_res.status_code == 200
        result = admin_res.json()
        assert result["status"] == "INGESTED"
        assert "record_id" in result

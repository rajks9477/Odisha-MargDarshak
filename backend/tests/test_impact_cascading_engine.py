import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_corridor_cascading_impact_calculation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Corridor Cascading Impact
        res = await ac.get("/api/v1/impact/corridor/NH-6-SONAPUR-01", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "analysis_id" in data
        assert data["road_id"] == "NH-6-SONAPUR-01"
        assert data["total_affected_vehicles"] > 0
        assert data["total_affected_shipments"] >= 0
        assert data["total_estimated_delay_hours"] > 0.0
        assert len(data["nodes"]) >= 4
        assert len(data["edges"]) >= 3

        # Check graph nodes
        node_types = [n["node_type"] for n in data["nodes"]]
        assert "INCIDENT" in node_types
        assert "ROAD" in node_types
        assert "ROUTE" in node_types
        assert "SHIPMENT" in node_types or "DISTRICT" in node_types

@pytest.mark.asyncio
async def test_custom_what_if_impact_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Simulate 12-hour major landslide blockage
        sim_payload = {
            "road_id": "NH-6-SONAPUR-01",
            "hazard_type": "LANDSLIDE_MUDFLOW",
            "severity": "CRITICAL",
            "estimated_blockage_hours": 12.0,
        }

        res = await ac.post("/api/v1/impact/calculate-custom", json=sim_payload, headers=headers)
        assert res.status_code == 200
        sim_data = res.json()

        assert sim_data["severity"] == "CRITICAL"
        assert sim_data["total_estimated_delay_hours"] == 12.0
        assert "summary_chain" in sim_data
        assert "LANDSLIDE MUDFLOW" in sim_data["summary_chain"] or "LANDSLIDE_MUDFLOW" in sim_data["summary_chain"]

@pytest.mark.asyncio
async def test_active_disruptions_and_incident_linkage():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/impact/active-disruptions", headers=headers)
        assert res.status_code == 200
        disruptions = res.json()
        assert len(disruptions) >= 2
        for d in disruptions:
            assert "total_affected_vehicles" in d
            assert "summary_chain" in d

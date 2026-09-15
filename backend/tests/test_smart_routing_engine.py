import pytest
import json
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_logistics_hubs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/routes/hubs")
        assert res.status_code == 200
        hubs = res.json()
        assert len(hubs) >= 10
        hub_ids = [h["id"] for h in hubs]
        assert "GUWAHATI" in hub_ids
        assert "SHILLONG" in hub_ids
        assert "SILCHAR" in hub_ids
        assert "AIZAWL" in hub_ids
        assert "TAWANG" in hub_ids

@pytest.mark.asyncio
async def test_smart_routing_multi_candidate_calculation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Calculate Routes from Guwahati to Silchar
        calc_payload = {
            "origin_name": "Guwahati Central Hub, Assam",
            "destination_name": "Silchar Food & Medical Depot, Assam",
            "origin_latitude": 26.18,
            "origin_longitude": 91.73,
            "destination_latitude": 24.83,
            "destination_longitude": 92.79,
            "mission_priority": "ESSENTIAL_SAFETY",
        }
        res = await ac.post("/api/v1/routes/calculate", json=calc_payload, headers=headers)
        assert res.status_code == 200
        routes = res.json()
        assert len(routes) >= 2

        types = [r["route_type"] for r in routes]
        assert "RECOMMENDED" in types

        for r in routes:
            assert r["id"].startswith(("RTE-", "ROU-"))
            assert r["distance_km"] > 0
            assert r["estimated_time_minutes"] > 0
            assert "geometry_geojson" in r
            coords = json.loads(r["geometry_geojson"])
            assert len(coords) >= 2
            assert "risk_score" in r
            assert "risk_level" in r

@pytest.mark.asyncio
async def test_route_details_and_segments():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Calculate
        calc_res = await ac.post("/api/v1/routes/calculate", json={
            "origin_name": "Guwahati",
            "destination_name": "Silchar",
        }, headers=headers)
        assert calc_res.status_code == 200
        routes = calc_res.json()
        route_id = routes[0]["id"]

        # 2. Fetch Details
        detail_res = await ac.get(f"/api/v1/routes/{route_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == route_id
        assert "segments" in detail
        assert len(detail["segments"]) > 0
        for seg in detail["segments"]:
            assert "road_name" in seg
            assert "distance_km" in seg
            assert "status" in seg

@pytest.mark.asyncio
async def test_route_selection_and_activation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Calculate
        calc_res = await ac.post("/api/v1/routes/calculate", json={
            "origin_name": "Guwahati",
            "destination_name": "Aizawl",
        }, headers=headers)
        assert calc_res.status_code == 200
        routes = calc_res.json()
        route_id = routes[0]["id"]

        # 2. Select Route
        sel_res = await ac.post(f"/api/v1/routes/{route_id}/select", headers=headers)
        assert sel_res.status_code == 200
        sel_data = sel_res.json()
        assert sel_data["route_id"] == route_id
        assert sel_data["status"] == "ACTIVE"
        assert "Successfully activated" in sel_data["message"]

@pytest.mark.asyncio
async def test_route_deviation_detection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Calculate
        calc_res = await ac.post("/api/v1/routes/calculate", json={
            "origin_name": "Guwahati",
            "destination_name": "Shillong",
        }, headers=headers)
        routes = calc_res.json()
        route_id = routes[0]["id"]

        # 2. Check On-Track position (Nongpoh on NH-6: ~25.90, 91.88)
        on_track_res = await ac.post(
            f"/api/v1/routes/{route_id}/check-deviation",
            json={"current_latitude": 25.88, "current_longitude": 91.80, "deviation_threshold_km": 2.0},
            headers=headers,
        )
        assert on_track_res.status_code == 200
        assert on_track_res.json()["is_deviated"] is False

        # 3. Check Off-Route position (Far off near Tezpur: 26.65, 92.79)
        off_track_res = await ac.post(
            f"/api/v1/routes/{route_id}/check-deviation",
            json={"current_latitude": 26.65, "current_longitude": 92.79, "deviation_threshold_km": 2.0},
            headers=headers,
        )
        assert off_track_res.status_code == 200
        assert off_track_res.json()["is_deviated"] is True

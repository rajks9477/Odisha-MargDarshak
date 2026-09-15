import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_smart_routing_calculation_and_selection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Driver
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@nermargdarshak.in", "password": "Driver@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Driver's Active Trip or use fallback
        trips_res = await client.get("/api/v1/driver/trips", headers=headers)
        assert trips_res.status_code == 200
        trips = trips_res.json()
        trip_id = trips[0]["id"] if trips else None

        # 3. Calculate Smart Candidate Routes
        calc_payload = {
            "trip_id": trip_id,
            "origin_latitude": 26.18,
            "origin_longitude": 91.73,
            "destination_latitude": 24.83,
            "destination_longitude": 92.79,
            "mission_priority": "ESSENTIAL_SAFETY",
        }
        routes_res = await client.post("/api/v1/routes/calculate", json=calc_payload, headers=headers)
        assert routes_res.status_code == 200
        candidate_routes = routes_res.json()
        assert len(candidate_routes) >= 2

        # Verify candidate route types
        types = [r["route_type"] for r in candidate_routes]
        assert "RECOMMENDED" in types
        assert "FASTEST" in types

        rec_route = next(r for r in candidate_routes if r["route_type"] == "RECOMMENDED")
        assert rec_route["distance_km"] > 0
        assert rec_route["estimated_time_minutes"] > 0
        assert rec_route["geometry_geojson"] is not None
        route_id = rec_route["id"]

        # 4. Get Route Details with Segments
        detail_res = await client.get(f"/api/v1/routes/{route_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == route_id
        assert len(detail["segments"]) >= 1

        # 5. Select Route (Attach to Trip)
        sel_res = await client.post(f"/api/v1/routes/{route_id}/select", headers=headers)
        assert sel_res.status_code == 200
        assert sel_res.json()["status"] == "ACTIVE"

        # 6. Check Trip Routes Endpoint
        if trip_id:
            trip_routes_res = await client.get(f"/api/v1/trips/{trip_id}/routes", headers=headers)
            assert trip_routes_res.status_code == 200
            assert len(trip_routes_res.json()) >= 1

        # 7. Check Deviation Detector (On-route: Shillong GPS 25.57, 91.88)
        on_route_res = await client.post(
            f"/api/v1/routes/{route_id}/check-deviation",
            json={"current_latitude": 25.57, "current_longitude": 91.88, "deviation_threshold_km": 2.0},
            headers=headers,
        )
        assert on_route_res.status_code == 200
        assert on_route_res.json()["is_deviated"] is False
        assert on_route_res.json()["status"] in ["ON_TRACK", "CAUTION"]

        # Check Deviation Detector (Off-route: 50 km away in Imphal 24.81, 93.93)
        off_route_res = await client.post(
            f"/api/v1/routes/{route_id}/check-deviation",
            json={"current_latitude": 24.81, "current_longitude": 93.93, "deviation_threshold_km": 2.0},
            headers=headers,
        )
        assert off_route_res.status_code == 200
        assert off_route_res.json()["is_deviated"] is True
        assert off_route_res.json()["status"] == "OFF_ROUTE"

@pytest.mark.asyncio
async def test_smart_routing_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Citizen (cannot calculate driver smart routes)
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "citizen.gangtok@nermargdarshak.in", "password": "Citizen@Pass123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        calc_payload = {
            "origin_latitude": 26.18,
            "origin_longitude": 91.73,
            "destination_latitude": 24.83,
            "destination_longitude": 92.79,
        }
        res = await client.post("/api/v1/routes/calculate", json=calc_payload, headers=headers)
        assert res.status_code == 403

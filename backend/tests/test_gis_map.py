import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.spatial import (
    haversine_distance_km,
    haversine_distance_meters,
    find_nearest_road,
    is_point_in_polygon,
)

def test_spatial_utilities_math():
    # Bhubaneswar (26.18, 91.73) to Cuttack (25.57, 91.88) ~ 70-100 km
    dist_km = haversine_distance_km(26.18, 91.73, 25.57, 91.88)
    assert 60.0 < dist_km < 110.0

    # Point in Polygon
    # Box: [[91.50, 26.05], [91.95, 26.05], [91.95, 26.30], [91.50, 26.30]]
    polygon = [[91.50, 26.05], [91.95, 26.05], [91.95, 26.30], [91.50, 26.30]]
    assert is_point_in_polygon(26.18, 91.73, polygon) is True
    assert is_point_in_polygon(28.00, 95.00, polygon) is False

@pytest.mark.asyncio
async def test_get_map_roads_and_status_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Driver to get token
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@odishamargdarshak.in", "password": "Driver@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get All Roads
        roads_res = await client.get("/api/v1/map/roads", headers=headers)
        assert roads_res.status_code == 200
        roads = roads_res.json()
        assert len(roads) >= 4
        
        # Verify 4-tier statuses exist
        statuses = {r["status"] for r in roads}
        assert "GREEN" in statuses
        assert "ORANGE" in statuses or "RED" in statuses

        # 3. Filter by Status = ORANGE
        orange_roads_res = await client.get("/api/v1/map/roads?status=ORANGE", headers=headers)
        assert orange_roads_res.status_code == 200
        orange_roads = orange_roads_res.json()
        assert all(r["status"] == "ORANGE" for r in orange_roads)

        # 4. Get Road Detail
        road_id = roads[0]["id"]
        detail_res = await client.get(f"/api/v1/map/roads/{road_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert "nearby_incidents" in detail
        assert "coordinates" in detail

@pytest.mark.asyncio
async def test_get_bridges_districts_incidents():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@odishamargdarshak.in", "password": "Driver@Pass123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Bridges
        bridges_res = await client.get("/api/v1/map/bridges", headers=headers)
        assert bridges_res.status_code == 200
        bridges = bridges_res.json()
        assert len(bridges) >= 2
        assert bridges[0]["capacity_tonnes"] > 0

        # Districts
        districts_res = await client.get("/api/v1/map/districts", headers=headers)
        assert districts_res.status_code == 200
        districts = districts_res.json()
        assert len(districts) >= 3
        assert len(districts[0]["polygon"]) > 0

        # Incidents
        incidents_res = await client.get("/api/v1/map/incidents", headers=headers)
        assert incidents_res.status_code == 200
        incidents = incidents_res.json()
        assert len(incidents) >= 2
        assert incidents[0]["severity"] in ["LOW", "MODERATE", "CRITICAL"]

@pytest.mark.asyncio
async def test_driver_location_live_update_and_retrieval():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@odishamargdarshak.in", "password": "Driver@Pass123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Post Live GPS telemetry
        update_payload = {
            "latitude": 25.505,
            "longitude": 92.055,
            "accuracy_meters": 3.8,
            "speed_kmh": 48.5,
            "heading_degrees": 135.0,
            "client_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        post_res = await client.post("/api/v1/driver/location", json=update_payload, headers=headers)
        assert post_res.status_code == 200
        updated_data = post_res.json()
        assert updated_data["latitude"] == 25.505
        assert updated_data["longitude"] == 92.055
        assert updated_data["accuracy_meters"] == 3.8
        assert updated_data["is_moving"] is True
        assert updated_data["vehicle_number"] == "OD-05-GC-9104"

        # 2. Get Current Location
        get_res = await client.get("/api/v1/driver/location", headers=headers)
        assert get_res.status_code == 200
        curr_loc = get_res.json()
        assert curr_loc["latitude"] == 25.505
        assert curr_loc["nearest_road_name"] is not None

@pytest.mark.asyncio
async def test_driver_offline_batch_sync():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@odishamargdarshak.in", "password": "Driver@Pass123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Send batch of 3 queued offline pings
        batch_payload = {
            "locations": [
                {
                    "local_id": "loc-offline-001",
                    "latitude": 25.450,
                    "longitude": 92.200,
                    "accuracy_meters": 5.2,
                    "speed_kmh": 35.0,
                    "heading_degrees": 140.0,
                    "client_timestamp": datetime.now(timezone.utc).isoformat(),
                },
                {
                    "local_id": "loc-offline-002",
                    "latitude": 25.300,
                    "longitude": 92.280,
                    "accuracy_meters": 4.1,
                    "speed_kmh": 32.0,
                    "heading_degrees": 142.0,
                    "client_timestamp": datetime.now(timezone.utc).isoformat(),
                },
                {
                    "local_id": "loc-offline-003",
                    "latitude": 25.105,
                    "longitude": 92.365,
                    "accuracy_meters": 3.5,
                    "speed_kmh": 20.0,
                    "heading_degrees": 150.0,
                    "client_timestamp": datetime.now(timezone.utc).isoformat(),
                },
            ]
        }

        sync_res = await client.post("/api/v1/driver/location/sync-batch", json=batch_payload, headers=headers)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert sync_data["synced_count"] == 3
        assert "loc-offline-001" in sync_data["synced_local_ids"]
        assert "loc-offline-003" in sync_data["synced_local_ids"]

@pytest.mark.asyncio
async def test_driver_location_rbac_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Central Admin (Non-Driver role)
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "admin@odishamargdarshak.gov.in", "password": "Admin@Odisha2026"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Non-driver cannot post to driver location (403 Forbidden)
        post_res = await client.post(
            "/api/v1/driver/location",
            json={"latitude": 27.33, "longitude": 88.61, "accuracy_meters": 5.0},
            headers=headers,
        )
        assert post_res.status_code == 403


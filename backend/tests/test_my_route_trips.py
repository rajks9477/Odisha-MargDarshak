import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_current_active_assigned_trip():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch current active or assigned trip
        trip_resp = await ac.get("/api/v1/driver/trips/current", headers=headers)
        assert trip_resp.status_code == 200
        trip = trip_resp.json()
        assert trip is not None
        assert "origin_name" in trip
        assert "destination_name" in trip
        assert trip["distance_km"] > 0
        assert trip["status"] in ["ASSIGNED", "ACCEPTED", "READY", "STARTED", "PAUSED"]

@pytest.mark.asyncio
async def test_trip_full_lifecycle_and_gps_linkage():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch available assigned or active trips
        trips_res = await ac.get("/api/v1/driver/trips", headers=headers)
        assert trips_res.status_code == 200
        trips = trips_res.json()
        assert len(trips) >= 1

        # Pick an assigned trip, or if already started/paused, test from current state
        target_trip = next((t for t in trips if t["status"] == "ASSIGNED"), trips[0])
        trip_id = target_trip["id"]

        # 2. Accept if ASSIGNED
        if target_trip["status"] == "ASSIGNED":
            accept_res = await ac.post(f"/api/v1/driver/trips/{trip_id}/accept", json={
                "notes": "Pre-departure checklist verified",
            }, headers=headers)
            assert accept_res.status_code == 200
            assert accept_res.json()["status"] == "ACCEPTED"

        # 3. Start Trip (if not already started)
        current_res = await ac.get(f"/api/v1/driver/trips/{trip_id}", headers=headers)
        if current_res.json()["status"] in ["ASSIGNED", "ACCEPTED", "READY"]:
            start_res = await ac.post(f"/api/v1/driver/trips/{trip_id}/start", json={
                "start_latitude": 26.180,
                "start_longitude": 91.730,
                "notes": "Driver safety inspection complete",
            }, headers=headers)
            assert start_res.status_code == 200
            started_trip = start_res.json()
            assert started_trip["status"] == "STARTED"
            assert started_trip["actual_start"] is not None

        # 4. Check Route Geometry & Segments
        route_res = await ac.get(f"/api/v1/driver/trips/{trip_id}/route", headers=headers)
        assert route_res.status_code == 200
        route_data = route_res.json()
        assert "coordinates" in route_data
        assert len(route_data["coordinates"]) >= 2
        assert "segments" in route_data

        # 5. Check Trip Progress
        progress_res = await ac.get(f"/api/v1/driver/trips/{trip_id}/progress", headers=headers)
        assert progress_res.status_code == 200
        progress_data = progress_res.json()
        assert "total_distance_km" in progress_data
        assert "distance_remaining_km" in progress_data
        assert "progress_percentage" in progress_data
        assert "current_road_name" in progress_data

        # 6. Pause Trip
        pause_res = await ac.post(f"/api/v1/driver/trips/{trip_id}/pause", json={
            "reason": "Mountain convoy rest halt",
            "latitude": 25.570,
            "longitude": 91.880,
        }, headers=headers)
        assert pause_res.status_code == 200
        assert pause_res.json()["status"] == "PAUSED"
        assert pause_res.json()["pause_started_at"] is not None

        # 7. Resume Trip
        resume_res = await ac.post(f"/api/v1/driver/trips/{trip_id}/resume", json={
            "latitude": 25.570,
            "longitude": 91.880,
        }, headers=headers)
        assert resume_res.status_code == 200
        assert resume_res.json()["status"] == "STARTED"
        assert resume_res.json()["pause_started_at"] is None

        # 8. Complete Trip
        complete_res = await ac.post(f"/api/v1/driver/trips/{trip_id}/complete", json={
            "end_latitude": 25.105,
            "end_longitude": 92.365,
            "notes": "Medical cargo delivered to Sonapur Base",
            "final_distance_km": 100.0,
        }, headers=headers)
        assert complete_res.status_code == 200
        completed = complete_res.json()
        assert completed["status"] == "COMPLETED"
        assert completed["actual_end"] is not None
        assert completed["actual_duration_minutes"] >= 0

        # 9. Check Trip History
        history_res = await ac.get("/api/v1/driver/trips/history", headers=headers)
        assert history_res.status_code == 200
        history_items = history_res.json()
        assert len(history_items) >= 1
        assert any(t["id"] == trip_id for t in history_items)

        # 10. Check Trip Events
        events_res = await ac.get(f"/api/v1/driver/trips/{trip_id}/events", headers=headers)
        assert events_res.status_code == 200
        events = events_res.json()
        event_types = [e["event_type"] for e in events]
        assert "TRIP_PAUSED" in event_types
        assert "TRIP_RESUMED" in event_types
        assert "TRIP_COMPLETED" in event_types

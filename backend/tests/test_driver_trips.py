import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest.mark.asyncio
async def test_trip_full_lifecycle_and_transitions():
    await init_database()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Driver
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@nermargdarshak.in", "password": "Driver@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Assigned/Active Trips
        trips_res = await client.get("/api/v1/driver/trips", headers=headers)
        assert trips_res.status_code == 200
        trips = trips_res.json()
        assert len(trips) >= 1

        # Find an assigned or active trip
        assigned_trip = next((t for t in trips if t["status"] == "ASSIGNED"), None)
        if not assigned_trip:
            assigned_trip = trips[0]
        assert assigned_trip is not None
        trip_id = assigned_trip["id"]

        # 3. Transition to STARTED
        if assigned_trip["status"] == "ASSIGNED":
            accept_res = await client.post(
                f"/api/v1/driver/trips/{trip_id}/accept",
                json={"notes": "Vehicle inspection complete. Ready for transit."},
                headers=headers,
            )
            assert accept_res.status_code == 200
            assert accept_res.json()["status"] == "ACCEPTED"

        if assigned_trip["status"] in ["ASSIGNED", "ACCEPTED", "READY"]:
            start_res = await client.post(
                f"/api/v1/driver/trips/{trip_id}/start",
                json={"start_latitude": 24.830, "start_longitude": 92.790, "notes": "Departing Silchar depot"},
                headers=headers,
            )
            assert start_res.status_code == 200
            start_data = start_res.json()
            assert start_data["status"] == "STARTED"
            assert start_data["actual_start"] is not None

        # 5. Pause Trip (STARTED -> PAUSED)
        pause_res = await client.post(
            f"/api/v1/driver/trips/{trip_id}/pause",
            json={"reason": "Heavy rainfall caution at Badarpur ghat", "latitude": 24.88, "longitude": 92.55},
            headers=headers,
        )
        assert pause_res.status_code == 200
        assert pause_res.json()["status"] == "PAUSED"

        # 6. Resume Trip (PAUSED -> STARTED)
        resume_res = await client.post(
            f"/api/v1/driver/trips/{trip_id}/resume",
            json={"reason": "Rain subsided, clear transit", "latitude": 24.88, "longitude": 92.55},
            headers=headers,
        )
        assert resume_res.status_code == 200
        assert resume_res.json()["status"] == "STARTED"

        # 7. Complete Trip (STARTED -> COMPLETED)
        comp_res = await client.post(
            f"/api/v1/driver/trips/{trip_id}/complete",
            json={
                "end_latitude": 23.830,
                "end_longitude": 91.280,
                "final_notes": "Consignment safely delivered to Agartala Central Granary",
            },
            headers=headers,
        )
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert comp_data["status"] == "COMPLETED"
        assert comp_data["actual_end"] is not None

        # 8. Check Trip Details & Status Audit History
        detail_res = await client.get(f"/api/v1/driver/trips/{trip_id}", headers=headers)
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["status"] == "COMPLETED"
        assert len(detail_data["history"]) >= 2 # State audit trail recorded

        # 9. Check Trip History
        hist_res = await client.get("/api/v1/driver/trips/history", headers=headers)
        assert hist_res.status_code == 200
        hist_trips = hist_res.json()
        assert any(t["id"] == trip_id for t in hist_trips)

        # 10. Reset status back to STARTED for subsequent dashboard tests
        from app.db.session import AsyncSessionLocal
        from app.models.driver import Trip, TripStatus
        from sqlalchemy import update
        async with AsyncSessionLocal() as s:
            await s.execute(update(Trip).where(Trip.id == trip_id).values(status=TripStatus.STARTED, actual_end=None))
            await s.commit()

@pytest.mark.asyncio
async def test_invalid_status_transition_rejection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@nermargdarshak.in", "password": "Driver@Pass123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Completed trip (TRIP-NER-2026-0744) cannot be accepted again
        invalid_accept = await client.post(
            "/api/v1/driver/trips/TRIP-NER-2026-0744/accept",
            json={},
            headers=headers,
        )
        assert invalid_accept.status_code == 400

@pytest.mark.asyncio
async def test_driver_trip_rbac_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Non-driver role (Citizen) cannot access driver trips -> 403
        cit_login = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "citizen.gangtok@nermargdarshak.in", "password": "Citizen@Pass123"},
        )
        assert cit_login.status_code == 200
        cit_token = cit_login.json()["access_token"]
        cit_headers = {"Authorization": f"Bearer {cit_token}"}

        res = await client.get("/api/v1/driver/trips", headers=cit_headers)
        assert res.status_code == 403

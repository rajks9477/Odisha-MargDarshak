import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest.mark.asyncio
async def test_tracking_session_lifecycle_and_live_pings():
    await init_database()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Start Tracking Session
        session_resp = await ac.post("/api/v1/tracking/sessions", json={
            "start_latitude": 25.570,
            "start_longitude": 91.880,
            "notes": "Sonapur mountain transit corridor"
        }, headers=headers)
        assert session_resp.status_code in [200, 201]
        session = session_resp.json()
        assert session["id"].startswith("TRK-")
        assert session["status"] in ["TRACKING", "ACTIVE"]
        session_id = session["id"]

        # 3. Ingest Live GPS Telemetry Ping
        now = datetime.now(timezone.utc)
        ping_resp = await ac.post(f"/api/v1/tracking/sessions/{session_id}/locations", json={
            "latitude": 25.572,
            "longitude": 91.883,
            "accuracy_meters": 4.2,
            "altitude_meters": 1420.0,
            "speed_kmh": 45.0,
            "heading_degrees": 135.0,
            "client_timestamp": now.isoformat()
        }, headers=headers)
        assert ping_resp.status_code == 200
        ping = ping_resp.json()
        assert ping["is_valid"] is True
        assert ping["is_anomalous"] is False
        assert ping["accuracy_grade"] == "VALID"
        assert ping["nearest_road_name"] is not None

        # 4. Check Driver Live Location HUD
        loc_resp = await ac.get("/api/v1/driver/location", headers=headers)
        assert loc_resp.status_code == 200
        loc = loc_resp.json()
        assert loc["freshness"] == "LIVE"
        assert loc["speed_kmh"] == 45.0
        assert "Biren" in loc["driver_name"]

        # 5. Stop Tracking Session
        stop_resp = await ac.post(f"/api/v1/tracking/sessions/{session_id}/stop", json={
            "end_latitude": 25.580,
            "end_longitude": 91.890,
            "notes": "Trip concluded safely"
        }, headers=headers)
        assert stop_resp.status_code == 200
        assert stop_resp.json()["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_gps_anomaly_speed_jump_detection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Start session
        session_resp = await ac.post("/api/v1/tracking/sessions", json={
            "start_latitude": 25.100,
            "start_longitude": 92.300,
        }, headers=headers)
        session_id = session_resp.json()["id"]

        now = datetime.now(timezone.utc)

        # Ping 1 at Point A
        await ac.post(f"/api/v1/tracking/sessions/{session_id}/locations", json={
            "latitude": 25.100,
            "longitude": 92.300,
            "accuracy_meters": 5.0,
            "speed_kmh": 40.0,
            "client_timestamp": now.isoformat()
        }, headers=headers)

        # Ping 2: Teleport 45 km away in 2 seconds (Speed ~ 81,000 km/h)
        bad_time = now + timedelta(seconds=2)
        teleport_resp = await ac.post(f"/api/v1/tracking/sessions/{session_id}/locations", json={
            "latitude": 25.500, # ~45km jump
            "longitude": 92.300,
            "accuracy_meters": 5.0,
            "speed_kmh": 40.0,
            "client_timestamp": bad_time.isoformat()
        }, headers=headers)
        assert teleport_resp.status_code == 200
        bad_ping = teleport_resp.json()
        assert bad_ping["is_anomalous"] is True
        assert bad_ping["accuracy_grade"] == "INVALID"
        assert "ANOMALOUS_SPEED_JUMP" in bad_ping["validation_note"]

@pytest.mark.asyncio
async def test_excessive_gps_dilution_rejection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        session_resp = await ac.post("/api/v1/tracking/sessions", json={}, headers=headers)
        session_id = session_resp.json()["id"]

        now = datetime.now(timezone.utc)
        # Diluted GPS accuracy (250m)
        diluted_resp = await ac.post(f"/api/v1/tracking/sessions/{session_id}/locations", json={
            "latitude": 25.100,
            "longitude": 92.300,
            "accuracy_meters": 250.0,
            "client_timestamp": now.isoformat()
        }, headers=headers)
        assert diluted_resp.status_code == 200
        diluted = diluted_resp.json()
        assert diluted["is_valid"] is False
        assert diluted["accuracy_grade"] == "INVALID"
        assert "EXCESSIVE_GPS_DILUTION" in diluted["validation_note"]

@pytest.mark.asyncio
async def test_officer_fleet_live_monitoring_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Officer Login
        o_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.tawang@nermargdarshak.gov.in",
            "password": "Officer@Tawang2026"
        })
        o_headers = {"Authorization": f"Bearer {o_login.json()['access_token']}"}

        # 2. Officer Views Fleet Locations
        fleet_resp = await ac.get("/api/v1/tracking/vehicles/live", headers=o_headers)
        assert fleet_resp.status_code == 200
        fleet = fleet_resp.json()
        assert isinstance(fleet, list)
        assert len(fleet) >= 1

        # 3. Citizen Login
        c_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "citizen.gangtok@nermargdarshak.in",
            "password": "Citizen@Pass123"
        })
        c_headers = {"Authorization": f"Bearer {c_login.json()['access_token']}"}

        # 4. RBAC: Citizen cannot access government fleet telemetry
        cit_fleet = await ac.get("/api/v1/tracking/vehicles/live", headers=c_headers)
        assert cit_fleet.status_code == 403

@pytest.mark.asyncio
async def test_offline_tracking_batch_sync():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        session_resp = await ac.post("/api/v1/tracking/sessions", json={}, headers=headers)
        session_id = session_resp.json()["id"]

        now = datetime.now(timezone.utc)
        batch_payload = {
            "session_id": session_id,
            "pings": [
                {
                    "latitude": 25.120,
                    "longitude": 92.340,
                    "accuracy_meters": 5.0,
                    "speed_kmh": 38.0,
                    "client_timestamp": (now - timedelta(seconds=30)).isoformat(),
                },
                {
                    "latitude": 25.125,
                    "longitude": 92.345,
                    "accuracy_meters": 4.5,
                    "speed_kmh": 42.0,
                    "client_timestamp": (now - timedelta(seconds=15)).isoformat(),
                },
                {
                    "latitude": 25.130,
                    "longitude": 92.350,
                    "accuracy_meters": 4.0,
                    "speed_kmh": 46.0,
                    "client_timestamp": now.isoformat(),
                },
            ]
        }

        sync_resp = await ac.post(f"/api/v1/tracking/sessions/{session_id}/sync-offline", json=batch_payload, headers=headers)
        assert sync_resp.status_code == 200
        synced = sync_resp.json()
        assert len(synced) == 3
        assert all(p["is_valid"] is True for p in synced)

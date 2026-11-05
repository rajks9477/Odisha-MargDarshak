import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_driver_incident_creation_and_auto_attachment():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Submit Incident with GPS coordinates on NH-6
        incident_data = {
            "client_idempotency_key": "test_idem_driver_inc_001",
            "type": "LANDSLIDE",
            "severity": "HIGH",
            "description": "Large boulders and loose mud blocking uphill carriageway near Baitarani tunnel.",
            "latitude": 25.185,
            "longitude": 92.285,
            "gps_accuracy": 4.5,
            "location_source": "GPS",
        }
        res = await ac.post("/api/v1/driver/incidents", json=incident_data, headers=headers)
        assert res.status_code in [200, 201]
        data = res.json()

        assert data["id"].startswith("INC-")
        assert data["type"] == "LANDSLIDE"
        assert data["severity"] == "HIGH"
        assert data["status"] == "PENDING_VERIFICATION"
        assert data["location_source"] == "GPS"
        assert "Biren" in data["reporter_name"]
        assert data["road_name"] is not None
        assert data["district_name"] is not None

@pytest.mark.asyncio
async def test_location_source_manual_adjustment():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        incident_data = {
            "type": "ROAD_BLOCKAGE",
            "severity": "MEDIUM",
            "description": "Fallen banyan tree branch on outer curve.",
            "latitude": 25.200,
            "longitude": 92.300,
            "gps_accuracy": 30.0,
            "location_source": "MANUAL",
        }
        res = await ac.post("/api/v1/driver/incidents", json=incident_data, headers=headers)
        assert res.status_code in [200, 201]
        data = res.json()
        assert data["location_source"] == "MANUAL"

@pytest.mark.asyncio
async def test_media_upload_and_security_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # 1. Pre-upload valid JPEG
        image_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"\x00" * 200
        files = {"file": ("test_photo.jpg", io.BytesIO(image_content), "image/jpeg")}
        up_res = await ac.post("/api/v1/incidents/upload", files=files, headers=headers)
        assert up_res.status_code == 201
        up_data = up_res.json()
        assert up_data["url"].startswith("/uploads/incidents/")
        assert up_data["media_type"] == "image/jpeg"

        # 2. Reject malicious executable upload
        bad_files = {"file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00"), "application/x-msdownload")}
        bad_res = await ac.post("/api/v1/incidents/upload", files=bad_files, headers=headers)
        assert bad_res.status_code == 400

@pytest.mark.asyncio
async def test_voice_note_upload_and_transcription():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # 1. Create base incident
        inc_res = await ac.post("/api/v1/driver/incidents", json={
            "type": "WEATHER_HAZARD",
            "severity": "CRITICAL",
            "description": "Zero visibility dense fog and hail storm.",
            "latitude": 25.570,
            "longitude": 91.880,
        }, headers=headers)
        inc_id = inc_res.json()["id"]

        # 2. Upload voice note
        audio_content = b"RIFF" + b"\x00" * 300
        files = {"file": ("voice_note.webm", io.BytesIO(audio_content), "audio/webm")}
        data = {"transcript": "Heavy hailstorm and zero visibility along Cuttack bypass."}

        v_res = await ac.post(f"/api/v1/incidents/{inc_id}/voice", files=files, data=data, headers=headers)
        assert v_res.status_code == 200
        v_data = v_res.json()
        assert v_data["voice_transcript"] == "Heavy hailstorm and zero visibility along Cuttack bypass."

@pytest.mark.asyncio
async def test_driver_my_incidents_and_status_tracking():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # 1. Fetch My Incidents
        my_res = await ac.get("/api/v1/incidents/my", headers=headers)
        assert my_res.status_code == 200
        reports = my_res.json()
        assert isinstance(reports, list)
        assert len(reports) >= 1

        inc_id = reports[0]["id"]

        # 2. Fetch Status
        stat_res = await ac.get(f"/api/v1/incidents/{inc_id}/status", headers=headers)
        assert stat_res.status_code == 200
        stat_data = stat_res.json()
        assert stat_data["id"] == inc_id
        assert stat_data["status"] == "PENDING_VERIFICATION"

@pytest.mark.asyncio
async def test_driver_cannot_self_verify_incident():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Driver cannot verify incidents (only Field Officer / Admin can)
        driver_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        driver_headers = {"Authorization": f"Bearer {driver_resp.json()['access_token']}"}

        # Attempt verification as Driver -> 403 Forbidden
        verify_res = await ac.post(
            "/api/v1/officer/incidents/INC-TEST-001/verify",
            json={"verification_notes": "Attempting self verification"},
            headers=driver_headers
        )
        assert verify_res.status_code == 403

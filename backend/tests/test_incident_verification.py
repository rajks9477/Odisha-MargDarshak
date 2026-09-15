import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest.mark.asyncio
async def test_driver_incident_reporting_lifecycle():
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

        # 2. Report Incident with Evidence & Voice
        report_payload = {
            "type": "LANDSLIDE",
            "severity": "HIGH",
            "description": "Massive mudslide blocking both lanes 500m before Sonapur Tunnel.",
            "voice_transcript": "Heavy mud and boulders falling from cliff. Traffic halted.",
            "latitude": 25.1154,
            "longitude": 92.3685,
            "gps_accuracy": 4.5,
            "evidence_urls": ["/uploads/incidents/demo_slide_1.jpg"]
        }
        create_resp = await ac.post("/api/v1/driver/incidents", json=report_payload, headers=headers)
        assert create_resp.status_code == 201
        report = create_resp.json()
        assert report["id"].startswith("INC-")
        assert report["type"] == "LANDSLIDE"
        assert report["evidence_quality_score"] >= 70.0
        assert report["road_name"] is not None
        assert "Biren" in report["reporter_name"]

        # 3. Retrieve Driver Incident Detail
        detail_resp = await ac.get(f"/api/v1/driver/incidents/{report['id']}", headers=headers)
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert len(detail["evidence"]) == 1
        assert len(detail["audit_logs"]) >= 1
        assert detail["audit_logs"][0]["action"] == "SUBMITTED"

@pytest.mark.asyncio
async def test_spatial_duplicate_detection():
    import random
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login Driver
        d_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        d_headers = {"Authorization": f"Bearer {d_login.json()['access_token']}"}

        # Unique Coordinates per run (avoiding collisions)
        base_lat = 27.0 + random.uniform(0.1, 0.9)
        base_lon = 93.0 + random.uniform(0.1, 0.9)

        # First Report
        r1_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "VEHICLE_BREAKDOWN",
            "severity": "CRITICAL",
            "description": "Multi-axle truck broken down on hairpin curve.",
            "latitude": base_lat,
            "longitude": base_lon,
            "gps_accuracy": 3.0,
        }, headers=d_headers)
        assert r1_resp.status_code == 201
        r1 = r1_resp.json()
        assert r1["is_possible_duplicate"] is False

        # Second Report 90 meters away by Citizen
        c_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "citizen.gangtok@nermargdarshak.in",
            "password": "Citizen@Pass123"
        })
        c_headers = {"Authorization": f"Bearer {c_login.json()['access_token']}"}

        r2_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "VEHICLE_BREAKDOWN",
            "severity": "CRITICAL",
            "description": "Truck breakdown blocking road.",
            "latitude": base_lat + 0.0008, # ~90 meters away
            "longitude": base_lon + 0.0005,
            "gps_accuracy": 5.0,
        }, headers=c_headers)
        assert r2_resp.status_code == 201
        r2 = r2_resp.json()
        assert r2["is_possible_duplicate"] is True
        assert r2["parent_incident_id"] == r1["id"]

@pytest.mark.asyncio
async def test_officer_incident_verification_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Driver creates an incident
        d_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        d_headers = {"Authorization": f"Bearer {d_login.json()['access_token']}"}

        r_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "ROAD_BLOCKAGE",
            "severity": "CRITICAL",
            "description": "Fallen boulder completely blocking NH-6.",
            "latitude": 25.1154,
            "longitude": 92.3685,
        }, headers=d_headers)
        incident_id = r_resp.json()["id"]

        # 2. Officer Logs In
        o_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.tawang@nermargdarshak.gov.in",
            "password": "Officer@Tawang2026"
        })
        assert o_login.status_code == 200
        o_headers = {"Authorization": f"Bearer {o_login.json()['access_token']}"}

        # 3. Officer Lists Pending Queue
        pending_resp = await ac.get("/api/v1/officer/incidents/pending", headers=o_headers)
        assert pending_resp.status_code == 200
        pending_ids = [p["id"] for p in pending_resp.json()]
        assert incident_id in pending_ids

        # 4. Officer Verifies Incident
        verify_resp = await ac.post(f"/api/v1/officer/incidents/{incident_id}/verify", json={
            "verification_notes": "Confirmed on site by PWD Quick Response Team. Earthmover en route.",
            "action_taken": "PWD_EARTHMOVERS_DEPLOYED",
        }, headers=o_headers)
        assert verify_resp.status_code == 200
        verified = verify_resp.json()
        assert verified["status"] == "VERIFIED"
        assert "Tashi Norbu" in verified["verified_by"]

        # 5. Check Audit Log
        detail_resp = await ac.get(f"/api/v1/driver/incidents/{incident_id}", headers=o_headers)
        assert detail_resp.status_code == 200
        logs = detail_resp.json()["audit_logs"]
        assert any(l["action"] == "VERIFIED" and l["new_status"] == "VERIFIED" for l in logs)

@pytest.mark.asyncio
async def test_officer_incident_rejection_and_resolution():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Officer Login
        o_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.tawang@nermargdarshak.gov.in",
            "password": "Officer@Tawang2026"
        })
        assert o_login.status_code == 200
        o_headers = {"Authorization": f"Bearer {o_login.json()['access_token']}"}

        # Driver Login
        d_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        d_headers = {"Authorization": f"Bearer {d_login.json()['access_token']}"}

        # Create Incident 1 for Rejection
        r1_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "OTHER",
            "severity": "LOW",
            "description": "Small pebble on roadside shoulder.",
            "latitude": 25.1100,
            "longitude": 92.3600,
        }, headers=d_headers)
        inc1_id = r1_resp.json()["id"]

        # Reject Inc1
        rej_resp = await ac.post(f"/api/v1/officer/incidents/{inc1_id}/reject", json={
            "rejection_reason": "Hazard cleared by road patrol. Normal traffic unobstructed."
        }, headers=o_headers)
        assert rej_resp.status_code == 200
        assert rej_resp.json()["status"] == "REJECTED"

        # Create Incident 2 for Verification then Resolution
        r2_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "ROAD_DAMAGE",
            "severity": "MEDIUM",
            "description": "Potholes on bridge expansion joint.",
            "latitude": 25.1154,
            "longitude": 92.3685,
        }, headers=d_headers)
        inc2_id = r2_resp.json()["id"]

        # Verify Inc2
        await ac.post(f"/api/v1/officer/incidents/{inc2_id}/verify", json={
            "verification_notes": "Patchwork required."
        }, headers=o_headers)

        # Resolve Inc2
        res_resp = await ac.post(f"/api/v1/officer/incidents/{inc2_id}/resolve", json={
            "resolution_notes": "Cold-mix bitumen patching completed. Road smooth.",
            "reopened_road_status": "GREEN"
        }, headers=o_headers)
        assert res_resp.status_code == 200
        resolved = res_resp.json()
        assert resolved["status"] == "RESOLVED"
        assert "Tashi Norbu" in resolved["resolved_by"]

@pytest.mark.asyncio
async def test_evidence_file_security_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Driver Login
        d_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        d_headers = {"Authorization": f"Bearer {d_login.json()['access_token']}"}

        # Create report
        r_resp = await ac.post("/api/v1/driver/incidents", json={
            "type": "BRIDGE_DAMAGE",
            "severity": "HIGH",
            "description": "Cracked pillar after heavy rains.",
            "latitude": 25.1154,
            "longitude": 92.3685,
        }, headers=d_headers)
        incident_id = r_resp.json()["id"]

        # 1. Valid Image Upload
        img_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
        upload_resp = await ac.post(
            f"/api/v1/incidents/{incident_id}/evidence",
            files={"file": ("photo.jpg", io.BytesIO(img_bytes), "image/jpeg")},
            headers=d_headers
        )
        assert upload_resp.status_code == 201
        assert upload_resp.json()["file_name"] == "photo.jpg"

        # 2. Invalid Media Type Rejection
        bad_upload = await ac.post(
            f"/api/v1/incidents/{incident_id}/evidence",
            files={"file": ("script.sh", io.BytesIO(b"#!/bin/bash"), "application/x-sh")},
            headers=d_headers
        )
        assert bad_upload.status_code == 400

        # 3. RBAC Enforcement: Driver cannot call Officer Verify endpoint
        illegal_verify = await ac.post(
            f"/api/v1/officer/incidents/{incident_id}/verify",
            json={"verification_notes": "Attempting illegal verification."},
            headers=d_headers
        )
        assert illegal_verify.status_code == 403

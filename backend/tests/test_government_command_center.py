import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_command_center_summary_and_corridors_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Kamrup
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Unified Summary
        sum_res = await ac.get("/api/v1/command-center/summary", headers=headers)
        assert sum_res.status_code == 200
        summary = sum_res.json()

        assert summary["total_active_incidents"] >= 0
        assert summary["critical_risk_corridors"] >= 0
        assert len(summary["regional_corridors"]) == 8
        state_names = [c["state"] for c in summary["regional_corridors"]]
        assert "Assam" in state_names
        assert "Meghalaya" in state_names
        assert "Arunachal Pradesh" in state_names

        # 3. Get Corridors Status
        corr_res = await ac.get("/api/v1/command-center/corridors/status", headers=headers)
        assert corr_res.status_code == 200
        corridors = corr_res.json()
        assert len(corridors) == 8

        # 4. RBAC Protection Check - Driver cannot access command summary
        driver_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        driver_token = driver_resp.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        forbidden_res = await ac.get("/api/v1/command-center/summary", headers=driver_headers)
        assert forbidden_res.status_code == 403

@pytest.mark.asyncio
async def test_command_center_incident_verification_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Officer Login
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.tawang@nermargdarshak.gov.in",
            "password": "Officer@Tawang2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Active Incidents Queue
        inc_res = await ac.get("/api/v1/command-center/incidents/active", headers=headers)
        assert inc_res.status_code == 200
        incidents = inc_res.json()
        assert len(incidents) >= 1
        target_inc_id = incidents[0]["id"]

        # 2. Verify Incident as Officer
        ver_res = await ac.post(
            f"/api/v1/command-center/incidents/{target_inc_id}/verify",
            json={"notes": "Ground verification completed by District Disaster Officer."},
            headers=headers,
        )
        assert ver_res.status_code == 200
        v_data = ver_res.json()
        assert v_data["status"] == "VERIFIED"

import uuid
import random
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_e2e_field_to_command_workflow():
    """
    End-to-End Workflow 1:
    Driver Login -> Report Incident -> Field Officer Verification -> AI Risk Recalculation -> 
    Cascading Impact Assessment -> Alert Generation & Acknowledgment -> Command Center Verification.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Step 1: Driver Login
        driver_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert driver_resp.status_code == 200
        driver_token = driver_resp.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        # Step 2: Driver Reports Incident
        u_lat = 25.18 + random.uniform(0.01, 0.05)
        u_lon = 92.28 + random.uniform(0.01, 0.05)
        inc_payload = {
            "type": "LANDSLIDE",
            "severity": "CRITICAL",
            "description": "Major rockfall blocking NH-6 corridor near Baitarani Tunnel",
            "latitude": u_lat,
            "longitude": u_lon,
            "gps_accuracy": 3.5,
            "location_source": "GPS",
        }
        inc_create_res = await ac.post("/api/v1/driver/incidents", json=inc_payload, headers=driver_headers)
        assert inc_create_res.status_code in [200, 201]
        incident = inc_create_res.json()
        incident_id = incident["id"]
        assert incident["status"] == "PENDING_VERIFICATION"

        # Step 3: Field Officer Logs in and Verifies Incident
        officer_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.koraput@odishamargdarshak.gov.in",
            "password": "Officer@Koraput2026"
        })
        assert officer_resp.status_code == 200
        officer_token = officer_resp.json()["access_token"]
        officer_headers = {"Authorization": f"Bearer {officer_token}"}

        verify_payload = {
            "verification_notes": "SDRF team on site; roadway completely obstructed.",
            "action_taken": "PWD_EARTHMOVERS_DEPLOYED"
        }
        verify_res = await ac.post(f"/api/v1/officer/incidents/{incident_id}/verify", json=verify_payload, headers=officer_headers)
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "VERIFIED"

        # Step 4: AI Risk Assessment
        risk_res = await ac.get("/api/v1/risk/corridor-summary", headers=driver_headers)
        assert risk_res.status_code == 200
        assert len(risk_res.json()) > 0

        # Step 5: Cascading Impact Evaluation
        impact_res = await ac.get("/api/v1/impact/corridor/NH-6-SONAPUR-01", headers=officer_headers)
        assert impact_res.status_code == 200
        impact_data = impact_res.json()
        assert impact_data["road_id"] == "NH-6-SONAPUR-01"
        assert impact_data["total_estimated_delay_hours"] >= 0.0

        # Step 6: Driver Alerts Listing & Acknowledgement
        alerts_res = await ac.get("/api/v1/driver/alerts", headers=driver_headers)
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        if len(alerts) > 0:
            first_alert_id = alerts[0]["id"]
            ack_res = await ac.post(
                f"/api/v1/driver/alerts/{first_alert_id}/acknowledge",
                json={"notes": "Driver Biren acknowledged road obstruction advisory."},
                headers=driver_headers
            )
            assert ack_res.status_code == 200

        # Step 7: Government Command Center Overview
        cmd_res = await ac.get("/api/v1/command-center/summary", headers=officer_headers)
        assert cmd_res.status_code == 200
        cmd_data = cmd_res.json()
        assert "total_active_incidents" in cmd_data
        assert "critical_risk_corridors" in cmd_data

@pytest.mark.asyncio
async def test_e2e_government_decision_support_and_resilience():
    """
    End-to-End Workflow 2:
    Central Admin Login -> Command Center -> What-If Simulation -> Resilience Planning ->
    Analytics CSV Report -> Integration Hub Sync -> Unified System Status Check.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Step 1: Central Admin Login
        admin_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@odishamargdarshak.gov.in",
            "password": "Admin@Odisha2026"
        })
        assert admin_resp.status_code == 200
        admin_token = admin_resp.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Step 2: What-If Simulation Execution
        sim_payload = {
            "title": "NH-6 Monsoonal Washout Stress Test",
            "target_road_id": "NH-6-SONAPUR-01",
            "disaster_type": "LANDSLIDE_BLOCKAGE",
            "severity_level": "CRITICAL",
            "duration_hours": 18.0,
        }
        sim_res = await ac.post("/api/v1/simulation/scenarios", json=sim_payload, headers=admin_headers)
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["scenario"]["title"] == "NH-6 Monsoonal Washout Stress Test"
        assert sim_data["extra_delay_hours"] > 0

        # Step 3: Resilience Asset Rankings
        resil_res = await ac.get("/api/v1/resilience/rankings", headers=admin_headers)
        assert resil_res.status_code == 200
        rankings = resil_res.json()
        assert len(rankings) > 0

        # Step 4: Decision Support & Report Export
        report_payload = {
            "report_title": "Quarterly NE Transport Disruption & Resilience Audit",
            "report_type": "CORRIDOR_DISRUPTION_SUMMARY",
            "state_filter": "Odisha",
        }
        report_res = await ac.post("/api/v1/analytics/reports/generate", json=report_payload, headers=admin_headers)
        assert report_res.status_code == 200
        assert report_res.json()["report_type"] == "CORRIDOR_DISRUPTION_SUMMARY"

        # Step 5: External Ingestion Sync
        sync_res = await ac.post("/api/v1/integration/connectors/CONN-IMD-RADAR-01/sync", headers=admin_headers)
        assert sync_res.status_code == 200
        assert sync_res.json()["status"] == "SUCCESS"

        # Step 6: System Production Health Check
        sys_res = await ac.get("/api/v1/system/status")
        assert sys_res.status_code == 200
        sys_data = sys_res.json()
        assert sys_data["environment"] == "PRODUCTION_READY"
        assert sys_data["subsystems"]["database_postgis"]["status"] == "HEALTHY"
        assert len(sys_data["modules_online"]) >= 22

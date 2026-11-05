import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_analytics_overview_and_trends():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Khordha
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Analytics Overview
        ov_res = await ac.get("/api/v1/analytics/overview", headers=headers)
        assert ov_res.status_code == 200
        ov_data = ov_res.json()
        assert ov_data["total_verified_incidents"] > 0
        assert ov_data["average_corridor_delay_hours"] > 0
        assert ov_data["network_health_index_pct"] > 0
        assert "incident_change_pct" in ov_data
        assert "state_distribution" in ov_data

        # 3. Trends
        tr_res = await ac.get("/api/v1/analytics/trends", headers=headers)
        assert tr_res.status_code == 200
        tr_data = tr_res.json()
        assert len(tr_data) >= 3
        for dp in tr_data:
            assert "period" in dp
            assert "incidents_count" in dp
            assert "average_delay_hours" in dp

@pytest.mark.asyncio
async def test_decision_support_and_report_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Decision Support Findings
        ds_res = await ac.get("/api/v1/analytics/decision-support", headers=headers)
        assert ds_res.status_code == 200
        ds_data = ds_res.json()
        assert len(ds_data) >= 2
        for item in ds_data:
            assert "analytical_recommendation" in item
            assert "justification" in item
            assert "urgency" in item

        # 2. Generate Report
        gen_req = {
            "report_title": "Quarterly NE Transport Disruption & Resilience Audit",
            "report_type": "CORRIDOR_DISRUPTION_SUMMARY",
            "state_filter": "Odisha",
        }
        gen_res = await ac.post("/api/v1/analytics/reports/generate", json=gen_req, headers=headers)
        assert gen_res.status_code == 200
        rep_data = gen_res.json()
        assert rep_data["state_filter"] == "Odisha"
        assert "id" in rep_data

        # 3. Download CSV
        dl_res = await ac.get(f"/api/v1/analytics/reports/{rep_data['id']}/download-csv", headers=headers)
        assert dl_res.status_code == 200
        assert "text/csv" in dl_res.headers["content-type"]
        assert "Total Incidents" in dl_res.text

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_resilience_rankings_and_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Khordha
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Resilience Rankings
        res = await ac.get("/api/v1/resilience/rankings", headers=headers)
        assert res.status_code == 200
        rankings = res.json()
        assert len(rankings) >= 3
        for item in rankings:
            assert "resilience_score" in item
            assert "criticality_level" in item
            assert "planning_recommendation" in item
            assert "data_provenance" in item

@pytest.mark.asyncio
async def test_get_resilience_summary_and_asset_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Regional Summary
        sum_res = await ac.get("/api/v1/resilience/summary", headers=headers)
        assert sum_res.status_code == 200
        s_data = sum_res.json()
        assert s_data["total_assets_evaluated"] >= 3
        assert s_data["average_network_resilience_score"] > 0

        # 2. Asset Detail
        det_res = await ac.get("/api/v1/resilience/assets/INF-NH16-BAITARANI", headers=headers)
        assert det_res.status_code == 200
        d_data = det_res.json()
        assert d_data["id"] == "INF-NH16-BAITARANI"
        assert d_data["criticality_level"] == "CRITICAL_SINGLE_POINT"

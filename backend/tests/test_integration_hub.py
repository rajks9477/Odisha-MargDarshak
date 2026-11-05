import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_integration_summary_and_connectors():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Khordha
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Integration Hub Summary
        sum_res = await ac.get("/api/v1/integration/summary", headers=headers)
        assert sum_res.status_code == 200
        s_data = sum_res.json()
        assert s_data["total_connectors"] >= 4
        assert s_data["data_freshness_pct"] > 0

        # 3. List Connectors
        conn_res = await ac.get("/api/v1/integration/connectors", headers=headers)
        assert conn_res.status_code == 200
        connectors = conn_res.json()
        assert len(connectors) >= 4
        for c in connectors:
            assert "id" in c
            assert "name" in c
            assert "connector_type" in c
            assert "status" in c

@pytest.mark.asyncio
async def test_connector_sync_and_batch_logs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Trigger Sync
        sync_res = await ac.post("/api/v1/integration/connectors/CONN-IMD-RADAR-01/sync", headers=headers)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert sync_data["status"] == "SUCCESS"
        assert sync_data["records_promoted"] > 0

        # 2. List Batches
        batch_res = await ac.get("/api/v1/integration/batches", headers=headers)
        assert batch_res.status_code == 200
        batches = batch_res.json()
        assert len(batches) > 0
        assert batches[0]["status"] == "SUCCESS"

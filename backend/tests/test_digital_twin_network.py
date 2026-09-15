import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_digital_twin_network_state():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Kamrup
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Digital Twin Network State
        res = await ac.get("/api/v1/digital-twin/state", headers=headers)
        assert res.status_code == 200
        state = res.json()
        assert "network_health_index" in state
        assert len(state["nodes"]) >= 3
        assert len(state["edges"]) >= 1
        assert "data_provenance" in state

@pytest.mark.asyncio
async def test_trace_entity_dependency_chain():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/digital-twin/entity/NH-6-SONAPUR-01", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "dependency_chain" in data
        assert len(data["dependency_chain"]) >= 4
        layers = [item["layer"] for item in data["dependency_chain"]]
        assert "ROAD_SEGMENT" in layers
        assert "CRITICAL_SHIPMENT" in layers

@pytest.mark.asyncio
async def test_create_and_list_digital_twin_snapshots():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Snapshot
        snp_res = await ac.post(
            "/api/v1/digital-twin/snapshot",
            json={"snapshot_title": "Pre-Monsoon Network State Baseline"},
            headers=headers,
        )
        assert snp_res.status_code == 200
        snp_data = snp_res.json()
        assert snp_data["status"] == "SNAPSHOT_CREATED"
        assert "snapshot_id" in snp_data

        # 2. List Snapshots
        list_res = await ac.get("/api/v1/digital-twin/snapshots", headers=headers)
        assert list_res.status_code == 200
        snapshots = list_res.json()
        assert len(snapshots) >= 1

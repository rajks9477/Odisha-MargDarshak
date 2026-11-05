import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_run_what_if_simulation_scenario():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Khordha
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Run What-If Simulation
        sim_req = {
            "title": "Hypothetical Baitarani Tunnel Collapse",
            "target_road_id": "NH-16-COASTAL-01",
            "disaster_type": "LANDSLIDE_BLOCKAGE",
            "severity_level": "CRITICAL",
            "duration_hours": 18.0,
        }
        res = await ac.post("/api/v1/simulation/scenarios", json=sim_req, headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "scenario" in data
        assert data["scenario"]["title"] == "Hypothetical Baitarani Tunnel Collapse"
        assert data["extra_delay_hours"] > 0
        assert data["delayed_shipments_count"] >= 1
        assert "Cuttack" in data["alternate_route_name"] or "Alternate" in data["alternate_route_name"] or "NH-" in data["alternate_route_name"]
        assert len(data["affected_districts"]) >= 1

@pytest.mark.asyncio
async def test_list_and_compare_simulations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.khordha@odishamargdarshak.gov.in",
            "password": "Admin@Khordha2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List Scenarios
        list_res = await ac.get("/api/v1/simulation/scenarios", headers=headers)
        assert list_res.status_code == 200
        scenarios = list_res.json()
        assert len(scenarios) >= 1

        # 2. Compare Scenarios
        comp_req = {
            "scenario_id_1": scenarios[0]["id"],
            "scenario_id_2": scenarios[0]["id"],
        }
        comp_res = await ac.post("/api/v1/simulation/compare", json=comp_req, headers=headers)
        assert comp_res.status_code == 200
        c_data = comp_res.json()
        assert c_data["status"] == "SCENARIOS_COMPARED"

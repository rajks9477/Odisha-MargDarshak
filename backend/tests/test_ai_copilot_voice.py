import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_copilot_text_query_rag_tools():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as District Admin Kamrup
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Risk / Road Query
        risk_req = {"query": "Which roads are high risk with active landslides today?"}
        res = await ac.post("/api/v1/copilot/query", json=risk_req, headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "answer" in data
        assert "Sonapur" in data["answer"] or "NH-6" in data["answer"]
        assert len(data["tools_used"]) >= 1
        assert "road_gis_tool" in data["tools_used"] or "risk_prediction_tool" in data["tools_used"]
        assert data["confidence_score"] > 80.0

@pytest.mark.asyncio
async def test_copilot_logistics_intent_and_proposed_action():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "district.kamrup@nermargdarshak.gov.in",
            "password": "Admin@Kamrup2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Logistics / Medicine shipment query
        log_req = {"query": "How many critical medicine shipments are delayed near Sonapur?"}
        res = await ac.post("/api/v1/copilot/query", json=log_req, headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "logistics_supply_tool" in data["tools_used"]
        assert "SHP-MED-NH6-01" in data["answer"] or "ICU Medicines" in data["answer"] or "delayed" in data["answer"]
        assert data["proposed_action"] is not None
        assert data["proposed_action"]["requires_human_approval"] is True

        # Officer confirms the proposed action
        appr_payload = {
            "action_type": data["proposed_action"]["action_type"],
            "target_resource_id": data["proposed_action"]["target_resource_id"],
            "officer_decision": "APPROVED",
            "officer_notes": "Authorized emergency reroute via NH-27.",
        }
        appr_res = await ac.post("/api/v1/copilot/actions/approve", json=appr_payload, headers=headers)
        assert appr_res.status_code == 200
        appr_data = appr_res.json()
        assert appr_data["status"] == "ACTION_CONFIRMED"

@pytest.mark.asyncio
async def test_copilot_voice_query_and_sample_prompts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Voice query simulation
        voice_res = await ac.post(
            "/api/v1/copilot/voice-query",
            data={"transcript": "Is there any heavy rainfall or flood warning on my route?"},
            headers=headers,
        )
        assert voice_res.status_code == 200
        v_data = voice_res.json()
        assert "weather_disaster_tool" in v_data["tools_used"] or "rainfall" in v_data["answer"].lower()

        # 2. Sample prompts
        prompts_res = await ac.get("/api/v1/copilot/sample-prompts", headers=headers)
        assert prompts_res.status_code == 200
        prompts = prompts_res.json()
        assert len(prompts) >= 3

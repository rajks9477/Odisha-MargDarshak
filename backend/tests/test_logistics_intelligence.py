import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_logistics_shipments_and_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Fetch Shipments
        res = await ac.get("/api/v1/logistics/shipments", headers=headers)
        assert res.status_code == 200
        shipments = res.json()
        assert len(shipments) >= 2
        for s in shipments:
            assert "id" in s
            assert "title font" not in s
            assert "cargo_category" in s
            assert s["priority"] in ["NORMAL", "IMPORTANT", "CRITICAL"]

        # 3. Filter by CRITICAL Priority
        crit_res = await ac.get("/api/v1/logistics/shipments?priority=CRITICAL", headers=headers)
        assert crit_res.status_code == 200
        crit_shipments = crit_res.json()
        assert all(s["priority"] == "CRITICAL" for s in crit_shipments)

@pytest.mark.asyncio
async def test_logistics_hubs_and_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Hubs
        hubs_res = await ac.get("/api/v1/logistics/hubs", headers=headers)
        assert hubs_res.status_code == 200
        hubs = hubs_res.json()
        assert len(hubs) >= 4
        hub_ids = [h["id"] for h in hubs]
        assert "WH-GUWAHATI-01" in hub_ids

        # 2. Fetch Metrics
        metrics_res = await ac.get("/api/v1/logistics/metrics", headers=headers)
        assert metrics_res.status_code == 200
        m = metrics_res.json()
        assert m["active_shipments_count"] >= 0
        assert m["total_in_transit_tonnes"] >= 0.0

@pytest.mark.asyncio
async def test_shipment_creation_status_update_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Admin Login
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@nermargdarshak.gov.in",
            "password": "Admin@NER2026"
        })
        token = login_resp.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Emergency Relief Consignment
        create_payload = {
            "title": "Pediatric ICU Oxygen Tanks & IV Fluids",
            "cargo_category": "MEDICINES_MEDICAL",
            "cargo_description": "Urgent oxygen shipment for Agartala District Hospital.",
            "priority": "CRITICAL",
            "weight_kg": 2800.0,
            "origin_name": "Guwahati Central Depot",
            "destination_name": "Agartala Civil Hospital",
        }

        create_res = await ac.post("/api/v1/logistics/shipments", json=create_payload, headers=admin_headers)
        assert create_res.status_code == 200
        shp = create_res.json()
        shipment_id = shp["id"]
        assert shp["status"] == "DISPATCH_PENDING"

        # 2. Update Status to IN_TRANSIT with progress
        update_res = await ac.post(
            f"/api/v1/logistics/shipments/{shipment_id}/status",
            json={"status": "IN_TRANSIT", "progress_pct": 25.0, "notes": "Dispatched via NH-6"},
            headers=admin_headers,
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["status"] == "IN_TRANSIT"
        assert updated["progress_pct"] == 25.0

        # 3. Driver Login -> Update Status to DELIVERED
        driver_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        driver_token = driver_resp.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        del_res = await ac.post(
            f"/api/v1/logistics/shipments/{shipment_id}/status",
            json={"status": "DELIVERED", "progress_pct": 100.0, "notes": "Handed over to Nodal Medical Officer"},
            headers=driver_headers,
        )
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert del_data["status"] == "DELIVERED"
        assert del_data["progress_pct"] == 100.0

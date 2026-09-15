import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_master_data_summary_and_facility_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Central Admin
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@nermargdarshak.gov.in",
            "password": "Admin@NER2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Summary
        sum_res = await ac.get("/api/v1/master-data/summary", headers=headers)
        assert sum_res.status_code == 200
        s_data = sum_res.json()
        assert s_data["total_roads"] > 0
        assert s_data["total_bridges"] > 0

        # 3. Create Facility
        u_suffix = uuid.uuid4().hex[:6]
        fac_payload = {
            "name": f"Guwahati Disaster Relief Hub {u_suffix}",
            "facility_type": "RELIEF_CENTER",
            "state": "Assam",
            "district": "Kamrup",
            "address": "NH-27 Khanapara Junction",
            "latitude": 26.123,
            "longitude": 91.801,
            "capacity_metric": "10000 MT Emergency Rations",
            "contact_phone": "+913612889900",
            "nodal_officer": "Sri K. Barman",
        }
        create_res = await ac.post("/api/v1/master-data/facilities", json=fac_payload, headers=headers)
        assert create_res.status_code == 200
        fac = create_res.json()
        fac_id = fac["id"]
        assert fac["status"] == "ACTIVE"
        assert fac["version"] == 1

        # 4. Update Facility
        update_res = await ac.put(f"/api/v1/master-data/facilities/{fac_id}", json={
            "capacity_metric": "15000 MT Expanded Storage"
        }, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["capacity_metric"] == "15000 MT Expanded Storage"
        assert update_res.json()["version"] == 2

        # 5. Archive & Restore
        arch_res = await ac.post(f"/api/v1/master-data/facilities/{fac_id}/archive", headers=headers)
        assert arch_res.status_code == 200
        assert arch_res.json()["status"] == "ARCHIVED"

        rest_res = await ac.post(f"/api/v1/master-data/facilities/{fac_id}/restore", headers=headers)
        assert rest_res.status_code == 200
        assert rest_res.json()["status"] == "ACTIVE"

@pytest.mark.asyncio
async def test_master_data_bulk_import():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@nermargdarshak.gov.in",
            "password": "Admin@NER2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        u_suffix = uuid.uuid4().hex[:6]
        bulk_payload = {
            "items": [
                {
                    "name": f"Aizawl Civil Trauma Care {u_suffix}",
                    "facility_type": "HOSPITAL",
                    "state": "Mizoram",
                    "district": "Aizawl",
                    "latitude": 23.727,
                    "longitude": 92.717,
                    "capacity_metric": "200 ICU Beds",
                    "contact_phone": "+913892340011",
                },
                {
                    "name": f"Tawang Mountain Helipad {u_suffix}",
                    "facility_type": "EMERGENCY_HELIPAD",
                    "state": "Arunachal Pradesh",
                    "district": "Tawang",
                    "latitude": 27.586,
                    "longitude": 91.869,
                    "capacity_metric": "Twin Engine Mi-17 Capable",
                    "contact_phone": "+913794222010",
                }
            ],
            "overwrite_existing": False
        }

        bulk_res = await ac.post("/api/v1/master-data/bulk-import", json=bulk_payload, headers=headers)
        assert bulk_res.status_code == 200
        b_data = bulk_res.json()
        assert b_data["total_processed"] == 2
        assert b_data["created_count"] == 2
        assert len(b_data["errors"]) == 0

import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_admin_user_provisioning_and_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Central Admin
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@odishamargdarshak.gov.in",
            "password": "Admin@Odisha2026"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Provision new Driver
        u_suffix = uuid.uuid4().hex[:6]
        new_driver_data = {
            "name": "Arun Borah",
            "email": f"arun.borah.{u_suffix}@odishamargdarshak.in",
            "phone": f"+91987{uuid.uuid4().int % 10000000:07d}",
            "password": "Driver@Pass123",
            "role": "DRIVER",
            "state": "Odisha",
            "district": "Khordha",
            "department": "Logistics & Transport",
            "employee_id": f"OD-DRV-{u_suffix.upper()}",
        }
        create_res = await ac.post("/api/v1/admin/users/create", json=new_driver_data, headers=headers)
        assert create_res.status_code == 200
        created_user = create_res.json()
        assert created_user["name"] == "Arun Borah"
        assert created_user["role"] == "DRIVER"
        assert created_user["status"] == "ACTIVE"
        user_id = created_user["id"]

        # 3. Suspend and Reactivate
        susp_res = await ac.post(f"/api/v1/admin/users/{user_id}/suspend", headers=headers)
        assert susp_res.status_code == 200
        assert susp_res.json()["status"] == "SUSPENDED"

        react_res = await ac.post(f"/api/v1/admin/users/{user_id}/reactivate", headers=headers)
        assert react_res.status_code == 200
        assert react_res.json()["status"] == "ACTIVE"

        # 4. Scope Update
        update_res = await ac.put(f"/api/v1/admin/users/{user_id}/role", json={
            "district": "Cachar",
            "department": "Emergency Medical Supplies",
        }, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["district"] == "Cachar"

@pytest.mark.asyncio
async def test_vehicle_assignment_and_audit_trail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@odishamargdarshak.gov.in",
            "password": "Admin@Odisha2026"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List vehicles
        v_res = await ac.get("/api/v1/admin/vehicles", headers=headers)
        assert v_res.status_code == 200
        vehicles = v_res.json()
        assert len(vehicles) > 0
        target_v = vehicles[0]

        # 2. Get a driver
        users_res = await ac.get("/api/v1/admin/users?role=DRIVER", headers=headers)
        assert users_res.status_code == 200
        drivers = users_res.json()["users"]
        assert len(drivers) > 0
        driver_id = drivers[0]["id"]

        # 3. Assign vehicle
        assign_res = await ac.put(f"/api/v1/admin/drivers/{driver_id}/assign-vehicle", json={
            "vehicle_id": target_v["id"]
        }, headers=headers)
        assert assign_res.status_code == 200
        assert assign_res.json()["assigned_driver_id"] == driver_id

        # 4. Audit logs
        audit_res = await ac.get("/api/v1/admin/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["logs"]
        assert len(logs) > 0

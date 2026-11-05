import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Odisha" in data["platform"] and "MargDarshak" in data["platform"]
        assert data["status"] == "OPERATIONAL"

@pytest.mark.asyncio
async def test_citizen_registration_and_immediate_login():
    uid = uuid.uuid4().hex[:6]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "name": f"Arun Sonowal {uid}",
            "email": f"arun_{uid}@example.com",
            "phone": f"9864{secrets_digits(6)}",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "CITIZEN",
            "state": "Odisha",
            "district": "Kendujhar"
        }
        res = await client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "ACTIVE"
        assert "token" in data
        assert data["token"]["user"]["role"] == "CITIZEN"

@pytest.mark.asyncio
async def test_field_officer_registration_pending_approval():
    uid = uuid.uuid4().hex[:6]
    phone = f"9865{secrets_digits(6)}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "name": f"Kiran Debbarma {uid}",
            "email": f"kiran_{uid}@tripura.gov.in",
            "phone": phone,
            "password": "Officer@Tripura123",
            "confirm_password": "Officer@Tripura123",
            "role": "FIELD_OFFICER",
            "department": "Public Works Department (PWD)",
            "state": "Odisha",
            "district": "West Tripura",
            "employee_id": f"TR-PWD-{uid}",
            "designation": "Assistant Engineer"
        }
        res = await client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "PENDING_APPROVAL"
        assert "token" not in data  # Must not issue active token to pending officer

        # Attempting login before approval should be blocked with 403
        login_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": f"kiran_{uid}@tripura.gov.in",
            "password": "Officer@Tripura123"
        })
        assert login_res.status_code == 403
        assert "pending" in login_res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_seeded_logins_and_rbac_enforcement():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Driver
        driver_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert driver_login.status_code == 200
        driver_token = driver_login.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        # 2. Login as Central Admin
        admin_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@odishamargdarshak.gov.in",
            "password": "Admin@Odisha2026"
        })
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. RBAC Check: Driver can access driver-zone
        dz_res = await client.get("/api/v1/rbac-test/driver-zone", headers=driver_headers)
        assert dz_res.status_code == 200

        # 4. RBAC Check: Driver MUST NOT access central-admin-zone (403 Forbidden)
        ca_res = await client.get("/api/v1/rbac-test/central-admin-zone", headers=driver_headers)
        assert ca_res.status_code == 403

        # 5. RBAC Check: Central Admin CAN access central-admin-zone
        ca_res2 = await client.get("/api/v1/rbac-test/central-admin-zone", headers=admin_headers)
        assert ca_res2.status_code == 200

@pytest.mark.asyncio
async def test_admin_approval_and_activation_workflow():
    uid = uuid.uuid4().hex[:6]
    officer_email = f"pending_officer_{uid}@odishamargdarshak.gov.in"
    officer_pass = "Officer@Pass2026"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register a new pending officer
        reg_res = await client.post("/api/v1/auth/register", json={
            "name": f"Officer {uid}",
            "email": officer_email,
            "phone": f"9871{secrets_digits(6)}",
            "password": officer_pass,
            "confirm_password": officer_pass,
            "role": "FIELD_OFFICER",
            "department": "State Disaster Response Force (SDRF)",
            "state": "Odisha",
            "district": "Berhampur",
            "employee_id": f"MZ-SDRF-{uid}",
            "designation": "Zonal Inspector"
        })
        assert reg_res.status_code == 201

        # 2. Central Admin login
        admin_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "admin@odishamargdarshak.gov.in",
            "password": "Admin@Odisha2026"
        })
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        # 3. Get pending users list
        pending_res = await client.get("/api/v1/admin/users/pending", headers=admin_headers)
        assert pending_res.status_code == 200
        pending_users = pending_res.json()["users"]
        target_user = next((u for u in pending_users if u["email"] == officer_email), None)
        assert target_user is not None
        target_id = target_user["id"]

        # 4. Approve the officer
        approve_res = await client.post(f"/api/v1/admin/users/{target_id}/approve", headers=admin_headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "ACTIVE"

        # 5. Now the approved officer should be able to log in
        officer_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": officer_email,
            "password": officer_pass
        })
        assert officer_login.status_code == 200
        assert officer_login.json()["user"]["status"] == "ACTIVE"

@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow():
    uid = uuid.uuid4().hex[:6]
    test_email = f"reset_test_{uid}@gmail.com"
    initial_pass = "InitialPass@2026"
    new_pass = "NewPass@2026Updated"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create user
        await client.post("/api/v1/auth/register", json={
            "name": f"Reset User {uid}",
            "email": test_email,
            "phone": f"9872{secrets_digits(6)}",
            "password": initial_pass,
            "confirm_password": initial_pass,
            "role": "CITIZEN"
        })

        # Request password reset
        fp_res = await client.post("/api/v1/auth/forgot-password", json={
            "email_or_phone": test_email
        })
        assert fp_res.status_code == 200
        data = fp_res.json()
        assert "token" in data
        assert "otp_code" in data
        token = data["token"]
        otp = data["otp_code"]

        # Reset password
        reset_res = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "otp_code": otp,
            "new_password": new_pass,
            "confirm_password": new_pass
        })
        assert reset_res.status_code == 200

        # Login with new password
        login_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": test_email,
            "password": new_pass
        })
        assert login_res.status_code == 200

@pytest.mark.asyncio
async def test_duplicate_registration_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register user with same email as admin
        payload = {
            "name": "Imposter Admin",
            "email": "admin@odishamargdarshak.gov.in",
            "phone": "9864999999",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "CITIZEN"
        }
        res = await client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 400
        assert "already exists" in res.json()["detail"]

@pytest.mark.asyncio
async def test_password_strength_and_mismatch_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Weak password (missing uppercase and number)
        res1 = await client.post("/api/v1/auth/register", json={
            "name": "Test User",
            "email": "weakpass@example.com",
            "phone": "9864111111",
            "password": "weakpassword",
            "confirm_password": "weakpassword",
            "role": "CITIZEN"
        })
        assert res1.status_code == 422

        # Password mismatch
        res2 = await client.post("/api/v1/auth/register", json={
            "name": "Test User",
            "email": "mismatch@example.com",
            "phone": "9864111112",
            "password": "Password@123",
            "confirm_password": "DifferentPassword@123",
            "role": "CITIZEN"
        })
        assert res2.status_code == 422

def secrets_digits(length: int = 6) -> str:
    import random
    return "".join([str(random.randint(0, 9)) for _ in range(length)])

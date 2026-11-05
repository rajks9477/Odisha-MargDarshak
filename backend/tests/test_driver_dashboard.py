import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_driver_profile_and_rbac_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Driver Login
        driver_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert driver_res.status_code == 200
        driver_token = driver_res.json()["access_token"]
        driver_headers = {"Authorization": f"Bearer {driver_token}"}

        # 2. Citizen Login
        citizen_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "citizen.rashmita@gmail.com",
            "password": "Citizen@Pass123"
        })
        assert citizen_res.status_code == 200
        citizen_headers = {"Authorization": f"Bearer {citizen_res.json()['access_token']}"}

        # 3. RBAC Check: Citizen MUST receive 403 Forbidden on driver profile endpoint
        cit_profile = await client.get("/api/v1/driver/profile", headers=citizen_headers)
        assert cit_profile.status_code == 403

        # 4. RBAC Check: Driver receives 200 OK
        drv_profile = await client.get("/api/v1/driver/profile", headers=driver_headers)
        assert drv_profile.status_code == 200
        data = drv_profile.json()
        assert "Biren" in data["name"]
        assert "20180092415" in data["license_number"]
        assert data["assigned_vehicle"] is not None
        assert data["assigned_vehicle"]["vehicle_number"] == "OD-05-GC-9104"
        assert data["active_trip"] is not None
        assert data["active_trip"]["trip_number"].startswith("TRIP-ODI-2026-")

@pytest.mark.asyncio
async def test_driver_availability_update():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        driver_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {driver_res.json()['access_token']}"}

        # Update to AVAILABLE
        avail_res = await client.patch("/api/v1/driver/availability", json={"availability": "AVAILABLE"}, headers=headers)
        assert avail_res.status_code == 200
        assert avail_res.json()["availability"] == "AVAILABLE"

        # Verify in profile
        prof_res = await client.get("/api/v1/driver/profile", headers=headers)
        assert prof_res.json()["availability"] == "AVAILABLE"

        # Update to OFFLINE
        offline_res = await client.patch("/api/v1/driver/availability", json={"availability": "OFFLINE"}, headers=headers)
        assert offline_res.status_code == 200
        assert offline_res.json()["availability"] == "OFFLINE"

        # Set back to ON_TRIP
        back_res = await client.patch("/api/v1/driver/availability", json={"availability": "ON_TRIP"}, headers=headers)
        assert back_res.status_code == 200
        assert back_res.json()["availability"] == "ON_TRIP"

@pytest.mark.asyncio
async def test_driver_vehicle_and_active_trip_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        driver_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {driver_res.json()['access_token']}"}

        # Test Vehicle endpoint
        v_res = await client.get("/api/v1/driver/vehicle", headers=headers)
        assert v_res.status_code == 200
        vehicle = v_res.json()
        assert vehicle["vehicle_number"] == "OD-05-GC-9104"
        assert vehicle["status"] in ["OPERATIONAL", "IN_TRANSIT"]
        assert vehicle["capacity_tonnes"] == 16.5

        # Test Active Trip endpoint
        t_res = await client.get("/api/v1/driver/active-trip", headers=headers)
        assert t_res.status_code == 200
        trip = t_res.json()
        assert trip["trip_number"].startswith("TRIP-ODI-2026-")
        assert len(trip["destination_name"]) > 0
        assert trip["distance_km"] > 0

@pytest.mark.asyncio
async def test_driver_alerts_and_acknowledgement():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        driver_res = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {driver_res.json()['access_token']}"}

        # Get alerts
        alerts_res = await client.get("/api/v1/driver/alerts", headers=headers)
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        assert len(alerts) >= 1

        # Mark first alert as read
        alert_id = alerts[0]["id"]
        read_res = await client.post(f"/api/v1/driver/alerts/{alert_id}/read", headers=headers)
        assert read_res.status_code == 200
        assert read_res.json()["id"] == alert_id
        assert read_res.json()["is_read"] is True

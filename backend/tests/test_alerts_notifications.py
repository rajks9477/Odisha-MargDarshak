import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_driver_alerts_listing_and_priority_sorting():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver Biren
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Alerts
        res = await ac.get("/api/v1/driver/alerts", headers=headers)
        assert res.status_code == 200
        alerts = res.json()
        assert isinstance(alerts, list)
        assert len(alerts) > 0

        # Verify severity ranking structure
        for a in alerts:
            assert "id" in a
            assert "title" in a
            assert "message" in a
            assert "severity" in a
            assert "type" in a
            assert "status" in a
            assert "is_read" in a
            assert "is_acknowledged" in a

@pytest.mark.asyncio
async def test_driver_alerts_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Filter by severity=CRITICAL
        res_crit = await ac.get("/api/v1/driver/alerts?severity=CRITICAL", headers=headers)
        assert res_crit.status_code == 200
        crit_alerts = res_crit.json()
        for a in crit_alerts:
            assert a["severity"] == "CRITICAL"

        # Filter by unread_only=true
        res_unread = await ac.get("/api/v1/driver/alerts?unread_only=true", headers=headers)
        assert res_unread.status_code == 200
        unread_alerts = res_unread.json()
        for a in unread_alerts:
            assert a["is_read"] is False

@pytest.mark.asyncio
async def test_driver_alerts_unread_count_and_banner():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Unread count endpoint
        res_count = await ac.get("/api/v1/driver/alerts/unread-count", headers=headers)
        assert res_count.status_code == 200
        count_data = res_count.json()
        assert "unread_count" in count_data
        assert "critical_count" in count_data
        assert "last_sync" in count_data

        # 2. Active emergency banner
        res_banner = await ac.get("/api/v1/driver/alerts/active-banner", headers=headers)
        assert res_banner.status_code == 200
        banner_alert = res_banner.json()
        if banner_alert:
            assert banner_alert["severity"] in ["CRITICAL", "HIGH"]
            assert banner_alert["is_acknowledged"] is False

@pytest.mark.asyncio
async def test_driver_alert_read_and_acknowledge_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch first available alert
        res = await ac.get("/api/v1/driver/alerts", headers=headers)
        alerts = res.json()
        assert len(alerts) > 0
        target_alert = alerts[0]
        alert_id = target_alert["id"]

        # 2. Mark alert read
        res_read = await ac.post(f"/api/v1/driver/alerts/{alert_id}/read", headers=headers)
        assert res_read.status_code == 200
        read_data = res_read.json()
        assert read_data["is_read"] is True
        assert read_data["status"] in ["READ", "ACKNOWLEDGED"]
        assert read_data["read_at"] is not None

        # 3. Acknowledge directive
        res_ack = await ac.post(
            f"/api/v1/driver/alerts/{alert_id}/acknowledge",
            json={"notes": "Driver Biren confirmed slowdown on mountain corridor"},
            headers=headers,
        )
        assert res_ack.status_code == 200
        ack_data = res_ack.json()
        assert ack_data["is_acknowledged"] is True
        assert ack_data["status"] == "ACKNOWLEDGED"
        assert ack_data["acknowledged_at"] is not None

        # 4. Mark all read
        res_all = await ac.post("/api/v1/driver/alerts/read-all", headers=headers)
        assert res_all.status_code == 200
        assert "updated_count" in res_all.json()

@pytest.mark.asyncio
async def test_driver_notification_preferences():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Preferences
        res = await ac.get("/api/v1/driver/alerts/preferences/settings", headers=headers)
        assert res.status_code == 200
        prefs = res.json()
        assert "language" in prefs
        assert "push_enabled" in prefs
        assert "allow_weather_warnings" in prefs

        # 2. Update Preferences
        update_payload = {
            "language": "hi-IN",
            "allow_traffic_updates": True,
            "push_enabled": True,
            "sms_enabled": True,
        }
        res_upd = await ac.put("/api/v1/driver/alerts/preferences/settings", json=update_payload, headers=headers)
        assert res_upd.status_code == 200
        upd_data = res_upd.json()
        assert upd_data["language"] == "hi-IN"

@pytest.mark.asyncio
async def test_driver_offline_alert_sync_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Driver
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@odishamargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get alert to sync
        res = await ac.get("/api/v1/driver/alerts", headers=headers)
        alerts = res.json()
        alert_id = alerts[0]["id"]

        # 3. Sync offline action
        sync_payload = {
            "actions": [
                {
                    "alert_id": alert_id,
                    "action": "ACKNOWLEDGE",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ]
        }
        res_sync = await ac.post("/api/v1/driver/alerts/sync-offline-actions", json=sync_payload, headers=headers)
        assert res_sync.status_code == 200
        sync_res = res_sync.json()
        assert sync_res["synced_count"] >= 1

        # 4. RBAC check: Citizen cannot access driver alerts
        citizen_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "citizen.rashmita@gmail.com",
            "password": "Citizen@Pass123"
        })
        citizen_token = citizen_login.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

        res_forbidden = await ac.get("/api/v1/driver/alerts", headers=citizen_headers)
        assert res_forbidden.status_code in [401, 403]

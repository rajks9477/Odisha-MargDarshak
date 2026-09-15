import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_driver_alerts_priority_and_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as Driver
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "driver.biren@nermargdarshak.in", "password": "Driver@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Driver Alerts (Priority Ordered: CRITICAL first)
        alerts_res = await client.get("/api/v1/driver/alerts", headers=headers)
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        assert len(alerts) >= 1
        # The first alert should be CRITICAL
        assert alerts[0]["severity"] == "CRITICAL"
        crit_alert = alerts[0]
        alert_id = crit_alert["id"]

        # 3. Check Unread Count
        unread_res = await client.get("/api/v1/driver/alerts/unread-count", headers=headers)
        assert unread_res.status_code == 200
        unread_data = unread_res.json()
        assert "unread_count" in unread_data
        assert "critical_count" in unread_data

        # 4. View Alert Detail (Marks as READ)
        detail_res = await client.get(f"/api/v1/driver/alerts/{alert_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == alert_id
        assert detail["is_read"] is True

        # 5. Acknowledge Alert
        ack_res = await client.post(
            f"/api/v1/driver/alerts/{alert_id}/acknowledge",
            json={"notes": "Driver Biren confirmed: detour taken via bypass."},
            headers=headers,
        )
        assert ack_res.status_code == 200
        ack_data = ack_res.json()
        assert ack_data["is_acknowledged"] is True
        assert ack_data["acknowledged_at"] is not None
        assert ack_data["status"] == "ACKNOWLEDGED"

        # 6. Preferences Get & Update
        pref_get = await client.get("/api/v1/driver/alerts/preferences/settings", headers=headers)
        assert pref_get.status_code == 200
        pref_data = pref_get.json()
        assert pref_data["language"] in ["en-IN", "hi-IN", "bn-IN", "as-IN"]

        pref_up = await client.put(
            "/api/v1/driver/alerts/preferences/settings",
            json={"language": "hi-IN", "voice_enabled": True},
            headers=headers,
        )
        assert pref_up.status_code == 200
        assert pref_up.json()["language"] == "hi-IN"
        assert pref_up.json()["voice_enabled"] is True

        # 7. Offline Action Sync
        now = datetime.now(timezone.utc)
        sync_payload = {
            "actions": [
                {
                    "alert_id": alert_id,
                    "action": "ACKNOWLEDGE",
                    "timestamp": now.isoformat(),
                }
            ]
        }
        sync_res = await client.post("/api/v1/driver/alerts/sync-offline-actions", json=sync_payload, headers=headers)
        assert sync_res.status_code == 200
        assert sync_res.json()["synced_count"] >= 1

@pytest.mark.asyncio
async def test_alerts_rbac_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Citizen (cannot access /driver/alerts)
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "citizen.gangtok@nermargdarshak.in", "password": "Citizen@Pass123"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/driver/alerts", headers=headers)
        assert res.status_code == 403

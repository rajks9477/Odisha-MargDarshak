import os
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, or_, case, and_, update
from app.core.security import decode_token
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.driver import Trip, TripStatus
from app.models.alert import (
    DriverAlert,
    NotificationDelivery,
    DriverNotificationPreference,
    AlertSeverity,
    AlertType,
    AlertStatus,
)
from app.schemas.alert import (
    DriverAlertResponse,
    AlertAcknowledgeRequest,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
    OfflineAlertSyncRequest,
    OfflineAlertSyncResponse,
)

router = APIRouter(tags=["Driver Alerts & Notifications"])

# WebSocket Connection Manager for Driver Real-Time Alert Broadcasts
class AlertConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, driver_id: str, websocket: WebSocket):
        await websocket.accept()
        if driver_id not in self.active_connections:
            self.active_connections[driver_id] = []
        self.active_connections[driver_id].append(websocket)

    def disconnect(self, driver_id: str, websocket: WebSocket):
        if driver_id in self.active_connections:
            self.active_connections[driver_id] = [
                ws for ws in self.active_connections[driver_id] if ws != websocket
            ]
            if not self.active_connections[driver_id]:
                del self.active_connections[driver_id]

    async def broadcast_to_driver(self, driver_id: str, message: dict):
        if driver_id in self.active_connections:
            for connection in self.active_connections[driver_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_all(self, message: dict):
        for driver_id, connections in list(self.active_connections.items()):
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

alert_manager = AlertConnectionManager()

# Priority sorting order: CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4, INFO=5
SEVERITY_ORDER = case(
    (DriverAlert.severity == AlertSeverity.CRITICAL, 1),
    (DriverAlert.severity == AlertSeverity.HIGH, 2),
    (DriverAlert.severity == AlertSeverity.MEDIUM, 3),
    (DriverAlert.severity == AlertSeverity.LOW, 4),
    (DriverAlert.severity == AlertSeverity.INFO, 5),
    else_=6,
)

@router.get("/driver/alerts", response_model=List[DriverAlertResponse])
async def get_driver_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)"),
    type: Optional[str] = Query(None, description="Filter by alert type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (UNREAD, READ, ACKNOWLEDGED)"),
    unread_only: Optional[bool] = Query(False, description="Return only unread notifications"),
    limit: Optional[int] = Query(50, ge=1, le=200),
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Fetch priority-ranked, location-aware and trip-aware alerts for the authenticated driver.
    Priority order: CRITICAL > HIGH > MEDIUM > LOW > INFO.
    """
    conditions = [
        or_(
            DriverAlert.driver_id == current_user.id,
            DriverAlert.driver_id == None,
        )
    ]

    if severity:
        conditions.append(DriverAlert.severity == severity.upper())
    if type:
        conditions.append(DriverAlert.type == type.upper())
    if status_filter:
        conditions.append(DriverAlert.status == status_filter.upper())
    if unread_only:
        conditions.append(DriverAlert.is_read == False)

    stmt = (
        select(DriverAlert)
        .where(and_(*conditions))
        .order_by(SEVERITY_ORDER, desc(DriverAlert.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    alerts = res.scalars().all()

    return [DriverAlertResponse.model_validate(a) for a in alerts]

@router.get("/driver/alerts/active-banner", response_model=Optional[DriverAlertResponse])
async def get_active_emergency_banner(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the highest-priority unread critical or high alert for the top emergency banner."""
    stmt = (
        select(DriverAlert)
        .where(
            or_(
                DriverAlert.driver_id == current_user.id,
                DriverAlert.driver_id == None,
            ),
            DriverAlert.is_acknowledged == False,
            DriverAlert.severity.in_([AlertSeverity.CRITICAL, AlertSeverity.HIGH]),
        )
        .order_by(SEVERITY_ORDER, desc(DriverAlert.created_at))
        .limit(1)
    )
    res = await db.execute(stmt)
    alert = res.scalars().first()
    return DriverAlertResponse.model_validate(alert) if alert else None

@router.post("/driver/alerts/read-all", response_model=dict)
async def mark_all_alerts_read(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Marks all alerts targeting this driver as READ."""
    now = datetime.now(timezone.utc)
    stmt = (
        update(DriverAlert)
        .where(
            or_(
                DriverAlert.driver_id == current_user.id,
                DriverAlert.driver_id == None,
            ),
            DriverAlert.is_read == False,
        )
        .values(is_read=True, status=AlertStatus.READ, read_at=now)
    )
    result = await db.execute(stmt)
    await db.commit()
    return {"message": "All alerts marked as read", "updated_count": result.rowcount}

@router.delete("/driver/alerts/{alert_id}", response_model=dict)
async def dismiss_alert(
    alert_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Dismiss a non-critical alert from driver view."""
    stmt = select(DriverAlert).where(DriverAlert.id == alert_id)
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id and alert.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    alert.is_read = True
    alert.is_acknowledged = True
    alert.status = AlertStatus.EXPIRED
    await db.commit()
    return {"message": "Alert dismissed", "id": alert_id}

@router.websocket("/driver/alerts/ws")
@router.websocket("/ws/alerts")
async def alerts_websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """Real-time WebSocket connection for streaming emergency alerts and notifications."""
    driver_id = "broadcast"
    if token:
        try:
            payload = decode_token(token)
            if payload and "sub" in payload:
                driver_id = payload["sub"]
        except Exception:
            pass

    await alert_manager.connect(driver_id, websocket)
    try:
        # Send initial connected greeting
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to Odisha MargDarshak real-time notification stream",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        while True:
            data = await websocket.receive_text()
            # Handle client heartbeat ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        alert_manager.disconnect(driver_id, websocket)
    except Exception:
        alert_manager.disconnect(driver_id, websocket)

@router.get("/driver/alerts/unread-count", response_model=dict)
async def get_unread_alert_count(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the unread count and critical alert count for badge indicators."""
    stmt = select(DriverAlert).where(
        or_(
            DriverAlert.driver_id == current_user.id,
            DriverAlert.driver_id == None,
        ),
        DriverAlert.is_read == False,
    )
    res = await db.execute(stmt)
    unread_alerts = res.scalars().all()

    critical_count = sum(1 for a in unread_alerts if a.severity == AlertSeverity.CRITICAL)

    return {
        "unread_count": len(unread_alerts),
        "critical_count": critical_count,
        "last_sync": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/driver/alerts/{alert_id}", response_model=DriverAlertResponse)
async def get_alert_detail(
    alert_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch alert details and automatically transition status to READ if currently UNREAD."""
    stmt = select(DriverAlert).where(DriverAlert.id == alert_id)
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id and alert.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to view this alert")

    # Mark as READ
    if not alert.is_read:
        alert.is_read = True
        if alert.status == AlertStatus.UNREAD:
            alert.status = AlertStatus.READ
        alert.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(alert)

    return DriverAlertResponse.model_validate(alert)

@router.post("/driver/alerts/{alert_id}/read", response_model=DriverAlertResponse)
async def mark_alert_read(
    alert_id: str,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Explicitly mark alert as READ."""
    stmt = select(DriverAlert).where(DriverAlert.id == alert_id)
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id and alert.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    alert.is_read = True
    if alert.status == AlertStatus.UNREAD:
        alert.status = AlertStatus.READ
    alert.read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)

    return DriverAlertResponse.model_validate(alert)

@router.post("/driver/alerts/{alert_id}/acknowledge", response_model=DriverAlertResponse)
async def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Driver formally acknowledges an emergency directive or warning."""
    stmt = select(DriverAlert).where(DriverAlert.id == alert_id)
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id and alert.driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    now = datetime.now(timezone.utc)
    alert.is_read = True
    alert.is_acknowledged = True
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = now
    if not alert.read_at:
        alert.read_at = now

    # Record notification delivery acknowledgement
    d_stmt = select(NotificationDelivery).where(NotificationDelivery.alert_id == alert_id)
    d_res = await db.execute(d_stmt)
    delivery = d_res.scalars().first()
    if delivery:
        delivery.acknowledged_at = now
        delivery.read_at = alert.read_at
    else:
        new_deliv = NotificationDelivery(
            alert_id=alert_id,
            channel="IN_APP",
            delivery_status="DELIVERED",
            read_at=alert.read_at,
            acknowledged_at=now,
        )
        db.add(new_deliv)

    await db.commit()
    await db.refresh(alert)

    return DriverAlertResponse.model_validate(alert)

@router.get("/driver/alerts/preferences/settings", response_model=NotificationPreferenceResponse)
async def get_driver_notification_preferences(
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch driver's alert delivery and language preferences."""
    stmt = select(DriverNotificationPreference).where(DriverNotificationPreference.driver_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = DriverNotificationPreference(
            driver_id=current_user.id,
            language="en-IN",
            allow_traffic_updates=True,
            allow_trip_updates=True,
            allow_weather_warnings=True,
            push_enabled=True,
            sms_enabled=True,
            voice_enabled=False,
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return NotificationPreferenceResponse.model_validate(pref)

@router.put("/driver/alerts/preferences/settings", response_model=NotificationPreferenceResponse)
async def update_driver_notification_preferences(
    payload: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update driver's non-critical notification settings."""
    stmt = select(DriverNotificationPreference).where(DriverNotificationPreference.driver_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = DriverNotificationPreference(driver_id=current_user.id)
        db.add(pref)

    if payload.language is not None:
        pref.language = payload.language
    if payload.allow_traffic_updates is not None:
        pref.allow_traffic_updates = payload.allow_traffic_updates
    if payload.allow_trip_updates is not None:
        pref.allow_trip_updates = payload.allow_trip_updates
    if payload.allow_weather_warnings is not None:
        pref.allow_weather_warnings = payload.allow_weather_warnings
    if payload.push_enabled is not None:
        pref.push_enabled = payload.push_enabled
    if payload.sms_enabled is not None:
        pref.sms_enabled = payload.sms_enabled
    if payload.voice_enabled is not None:
        pref.voice_enabled = payload.voice_enabled

    pref.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(pref)

    return NotificationPreferenceResponse.model_validate(pref)

@router.post("/driver/alerts/sync-offline-actions", response_model=OfflineAlertSyncResponse)
async def sync_offline_alert_actions(
    payload: OfflineAlertSyncRequest,
    current_user: User = Depends(require_roles([UserRole.DRIVER])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Syncs queued read and acknowledge timestamps recorded while driving in mountain offline zones."""
    count = 0
    for item in payload.actions:
        stmt = select(DriverAlert).where(DriverAlert.id == item.alert_id)
        res = await db.execute(stmt)
        alert = res.scalar_one_or_none()
        if alert:
            if item.action == "ACKNOWLEDGE":
                alert.is_read = True
                alert.is_acknowledged = True
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_at = item.timestamp
            elif item.action == "READ":
                alert.is_read = True
                if alert.status == AlertStatus.UNREAD:
                    alert.status = AlertStatus.READ
                alert.read_at = item.timestamp
            count += 1

    await db.commit()
    return OfflineAlertSyncResponse(
        synced_count=count,
        message=f"Synchronized {count} offline alert actions",
    )

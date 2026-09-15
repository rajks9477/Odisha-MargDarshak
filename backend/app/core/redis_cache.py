import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

class RedisCurrentStateStore:
    """
    High-performance in-memory key-value cache layer for real-time driver & vehicle positions.
    Maintains TTL expiration and stale vehicle detection, with drop-in Redis cluster compatibility.
    """
    def __init__(self):
        self._vehicles: Dict[str, Dict[str, Any]] = {}
        self._drivers: Dict[str, Dict[str, Any]] = {}
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def set_vehicle_state(self, vehicle_id: str, state: Dict[str, Any], ttl_seconds: int = 300) -> None:
        expires_at = time.time() + ttl_seconds
        self._vehicles[vehicle_id] = {
            **state,
            "vehicle_id": vehicle_id,
            "cached_at": time.time(),
            "expires_at": expires_at,
        }

    def get_vehicle_state(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        record = self._vehicles.get(vehicle_id)
        if not record:
            return None
        if time.time() > record.get("expires_at", 0):
            # Expired / TTL eviction
            del self._vehicles[vehicle_id]
            return None
        
        # Calculate seconds since last seen
        last_seen_sec = int(time.time() - record.get("cached_at", time.time()))
        return {
            **record,
            "last_seen_seconds_ago": last_seen_sec,
            "is_stale": last_seen_sec > 120,
        }

    def set_driver_state(self, driver_id: str, state: Dict[str, Any], ttl_seconds: int = 300) -> None:
        expires_at = time.time() + ttl_seconds
        self._drivers[driver_id] = {
            **state,
            "driver_id": driver_id,
            "cached_at": time.time(),
            "expires_at": expires_at,
        }

    def get_driver_state(self, driver_id: str) -> Optional[Dict[str, Any]]:
        record = self._drivers.get(driver_id)
        if not record:
            return None
        if time.time() > record.get("expires_at", 0):
            del self._drivers[driver_id]
            return None

        last_seen_sec = int(time.time() - record.get("cached_at", time.time()))
        return {
            **record,
            "last_seen_seconds_ago": last_seen_sec,
            "is_stale": last_seen_sec > 120,
        }

    def list_all_active_vehicles(self) -> List[Dict[str, Any]]:
        now = time.time()
        active = []
        expired_keys = []
        for vid, rec in self._vehicles.items():
            if now > rec.get("expires_at", 0):
                expired_keys.append(vid)
            else:
                last_seen_sec = int(now - rec.get("cached_at", now))
                active.append({
                    **rec,
                    "last_seen_seconds_ago": last_seen_sec,
                    "is_stale": last_seen_sec > 120,
                })
        for k in expired_keys:
            del self._vehicles[k]
        return active

# Global Singleton Current State Store
current_state_cache = RedisCurrentStateStore()

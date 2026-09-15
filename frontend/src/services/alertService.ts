import { ApiClient } from "@/lib/api";

export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export enum AlertType {
  ROAD_BLOCKAGE = "ROAD_BLOCKAGE",
  BRIDGE_CLOSURE = "BRIDGE_CLOSURE",
  FLOOD_WARNING = "FLOOD_WARNING",
  LANDSLIDE_WARNING = "LANDSLIDE_WARNING",
  TRAFFIC_DISRUPTION = "TRAFFIC_DISRUPTION",
  ROUTE_DISRUPTION = "ROUTE_DISRUPTION",
  EMERGENCY_INSTRUCTION = "EMERGENCY_INSTRUCTION",
  TRIP_UPDATE = "TRIP_UPDATE",
  GOVERNMENT_DIRECTIVE = "GOVERNMENT_DIRECTIVE",
  SYSTEM_NOTICE = "SYSTEM_NOTICE",
}

export enum AlertStatus {
  UNREAD = "UNREAD",
  READ = "READ",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  EXPIRED = "EXPIRED",
}

export interface DriverAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  source: string;
  driver_id?: string;
  trip_id?: string;
  incident_id?: string;
  road_id?: string;
  road_name?: string;
  location_name?: string;
  status: AlertStatus;
  is_read: boolean;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  read_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  driver_id: string;
  language: string;
  allow_traffic_updates: boolean;
  allow_trip_updates: boolean;
  allow_weather_warnings: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  voice_enabled: boolean;
}

const CACHED_ALERTS_KEY = "ner_cached_driver_alerts";
const OFFLINE_ALERT_ACTIONS_KEY = "ner_offline_alert_actions";

export const AlertService = {
  async getAlerts(): Promise<DriverAlert[]> {
    const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;

    if (!isOnline) {
      return this.getCachedAlerts();
    }

    try {
      const alerts = await ApiClient.get<DriverAlert[]>("/driver/alerts");
      this.cacheAlerts(alerts);
      return alerts;
    } catch (err) {
      console.warn("Failed to fetch live alerts; using cache", err);
      return this.getCachedAlerts();
    }
  },

  async getAlertDetails(alertId: string): Promise<DriverAlert> {
    return await ApiClient.get<DriverAlert>(`/driver/alerts/${alertId}`);
  },

  async markAsRead(alertId: string): Promise<DriverAlert> {
    const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;

    if (!isOnline) {
      this.queueOfflineAction(alertId, "READ");
      return {
        id: alertId,
        title: "",
        message: "",
        severity: AlertSeverity.MEDIUM,
        type: AlertType.ROAD_BLOCKAGE,
        source: "SYSTEM",
        status: AlertStatus.READ,
        is_read: true,
        is_acknowledged: false,
        created_at: new Date().toISOString(),
      };
    }

    return await ApiClient.post<DriverAlert>(`/driver/alerts/${alertId}/read`);
  },

  async acknowledgeAlert(alertId: string, notes?: string): Promise<DriverAlert> {
    const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;

    if (!isOnline) {
      this.queueOfflineAction(alertId, "ACKNOWLEDGE");
      return {
        id: alertId,
        title: "",
        message: "",
        severity: AlertSeverity.MEDIUM,
        type: AlertType.ROAD_BLOCKAGE,
        source: "SYSTEM",
        status: AlertStatus.ACKNOWLEDGED,
        is_read: true,
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    return await ApiClient.post<DriverAlert>(`/driver/alerts/${alertId}/acknowledge`, { notes });
  },

  async getUnreadCount(): Promise<{ unread_count: number; critical_count: number; last_sync: string }> {
    try {
      return await ApiClient.get<{ unread_count: number; critical_count: number; last_sync: string }>(
        "/driver/alerts/unread-count"
      );
    } catch {
      const cached = this.getCachedAlerts();
      const unread = cached.filter((a) => !a.is_read).length;
      const critical = cached.filter((a) => a.severity === AlertSeverity.CRITICAL && !a.is_read).length;
      return { unread_count: unread, critical_count: critical, last_sync: new Date().toISOString() };
    }
  },

  async getPreferences(): Promise<NotificationPreference> {
    return await ApiClient.get<NotificationPreference>("/driver/alerts/preferences/settings");
  },

  async updatePreferences(payload: Partial<NotificationPreference>): Promise<NotificationPreference> {
    return await ApiClient.put<NotificationPreference>("/driver/alerts/preferences/settings", payload);
  },

  cacheAlerts(alerts: DriverAlert[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CACHED_ALERTS_KEY, JSON.stringify(alerts));
      localStorage.setItem("ner_alerts_last_sync", new Date().toISOString());
    } catch (e) {
      console.error("Failed to cache alerts", e);
    }
  },

  getCachedAlerts(): DriverAlert[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(CACHED_ALERTS_KEY) || "[]");
    } catch {
      return [];
    }
  },

  queueOfflineAction(alertId: string, action: "READ" | "ACKNOWLEDGE") {
    if (typeof window === "undefined") return;
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_ALERT_ACTIONS_KEY) || "[]");
      queue.push({ alert_id: alertId, action, timestamp: new Date().toISOString() });
      localStorage.setItem(OFFLINE_ALERT_ACTIONS_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to queue offline alert action", e);
    }
  },

  async syncOfflineAlertActions(): Promise<number> {
    if (typeof window === "undefined" || !window.navigator.onLine) return 0;
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_ALERT_ACTIONS_KEY) || "[]");
      if (queue.length === 0) return 0;

      const res = await ApiClient.post<{ synced_count: number }>("/driver/alerts/sync-offline-actions", {
        actions: queue,
      });

      if (res && res.synced_count > 0) {
        localStorage.removeItem(OFFLINE_ALERT_ACTIONS_KEY);
        return res.synced_count;
      }
      return 0;
    } catch (err) {
      console.error("Alert offline sync failed", err);
      return 0;
    }
  },
};

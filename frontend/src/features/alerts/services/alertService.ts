import {
  DriverAlert,
  UnreadAlertCount,
  AlertFilterOptions,
  OfflineAlertAction,
} from "../types/alertTypes";
import { alertsApi } from "../api/alertsApi";
import { NotificationWebService } from "./notificationWebService";

const CACHE_KEY = "ner_cached_alerts_v1";
const OFFLINE_ACTIONS_KEY = "ner_offline_alert_actions_v1";

export class AlertService {
  /**
   * Fetch alerts with local caching and offline fallback
   */
  static async getAlerts(filters?: AlertFilterOptions): Promise<DriverAlert[]> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      return this.getCachedAlerts(filters);
    }

    try {
      const alerts = await alertsApi.getDriverAlerts(filters);
      this.cacheAlerts(alerts);
      return alerts;
    } catch (err) {
      console.warn("Network alert fetch failed, falling back to cache", err);
      return this.getCachedAlerts(filters);
    }
  }

  /**
   * Fetch unread counter
   */
  static async getUnreadCount(): Promise<UnreadAlertCount> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;
    if (!isOnline) {
      const cached = this.getCachedAlerts();
      const unread = cached.filter((a) => !a.is_read);
      const critical = unread.filter((a) => a.severity === "CRITICAL").length;
      return {
        unread_count: unread.length,
        critical_count: critical,
        last_sync: new Date().toISOString(),
      };
    }

    return alertsApi.getUnreadCount();
  }

  /**
   * Mark alert read (online or queue offline)
   */
  static async markRead(alertId: string): Promise<void> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    // Update local cache immediately for instant UI response
    this.updateCachedAlert(alertId, { is_read: true, status: "READ" as any });

    if (!isOnline) {
      this.queueOfflineAction(alertId, "READ");
      return;
    }

    try {
      await alertsApi.markAlertRead(alertId);
    } catch (e) {
      this.queueOfflineAction(alertId, "READ");
    }
  }

  /**
   * Acknowledge alert (online or queue offline)
   */
  static async acknowledge(alertId: string, notes?: string): Promise<void> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    this.updateCachedAlert(alertId, {
      is_read: true,
      is_acknowledged: true,
      status: "ACKNOWLEDGED" as any,
      acknowledged_at: new Date().toISOString(),
    });

    if (!isOnline) {
      this.queueOfflineAction(alertId, "ACKNOWLEDGE");
      return;
    }

    try {
      await alertsApi.acknowledgeAlert(alertId, notes);
    } catch (e) {
      this.queueOfflineAction(alertId, "ACKNOWLEDGE");
    }
  }

  /**
   * Process queued offline actions when network is restored
   */
  static async syncOfflineActions(): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine) return;

    try {
      const raw = localStorage.getItem(OFFLINE_ACTIONS_KEY);
      const actions: OfflineAlertAction[] = raw ? JSON.parse(raw) : [];

      if (actions.length > 0) {
        await alertsApi.syncOfflineActions(actions);
        localStorage.removeItem(OFFLINE_ACTIONS_KEY);
      }
    } catch (e) {
      console.warn("Failed to sync offline alert actions", e);
    }
  }

  // --- Local Cache Helpers ---

  private static getCachedAlerts(filters?: AlertFilterOptions): DriverAlert[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const alerts: DriverAlert[] = raw ? JSON.parse(raw) : [];
      if (!filters) return alerts;

      return alerts.filter((a) => {
        if (filters.severity && a.severity !== filters.severity) return false;
        if (filters.type && a.type !== filters.type) return false;
        if (filters.status && a.status !== filters.status) return false;
        if (filters.unread_only && a.is_read) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  private static cacheAlerts(alerts: DriverAlert[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.warn("Failed to cache alerts in localStorage", e);
    }
  }

  private static updateCachedAlert(alertId: string, updates: Partial<DriverAlert>): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const alerts: DriverAlert[] = JSON.parse(raw);
      const updated = alerts.map((a) => (a.id === alertId ? { ...a, ...updates } : a));
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to update cached alert", e);
    }
  }

  private static queueOfflineAction(alertId: string, action: "READ" | "ACKNOWLEDGE"): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(OFFLINE_ACTIONS_KEY);
      const actions: OfflineAlertAction[] = raw ? JSON.parse(raw) : [];
      actions.push({ alert_id: alertId, action, timestamp: new Date().toISOString() });
      localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
    } catch (e) {
      console.warn("Failed to queue offline alert action", e);
    }
  }
}

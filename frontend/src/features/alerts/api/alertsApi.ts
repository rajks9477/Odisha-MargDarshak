import {
  DriverAlert,
  UnreadAlertCount,
  AlertFilterOptions,
  NotificationPreference,
  OfflineAlertAction,
} from "../types/alertTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const alertsApi = {
  /**
   * Fetch driver alerts with optional filtering
   */
  async getDriverAlerts(filters?: AlertFilterOptions): Promise<DriverAlert[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.unread_only) params.append("unread_only", "true");

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/driver/alerts${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch alerts: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get unread badge counter
   */
  async getUnreadCount(): Promise<UnreadAlertCount> {
    const res = await fetch(`${API_BASE}/driver/alerts/unread-count`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch unread count");
    }

    return res.json();
  },

  /**
   * Get active high-priority emergency banner alert
   */
  async getActiveBannerAlert(): Promise<DriverAlert | null> {
    const res = await fetch(`${API_BASE}/driver/alerts/active-banner`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch active emergency banner");
    }

    return res.json();
  },

  /**
   * Get alert detail
   */
  async getAlertDetail(alertId: string): Promise<DriverAlert> {
    const res = await fetch(`${API_BASE}/driver/alerts/${alertId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch alert details");
    }

    return res.json();
  },

  /**
   * Mark single alert as read
   */
  async markAlertRead(alertId: string): Promise<DriverAlert> {
    const res = await fetch(`${API_BASE}/driver/alerts/${alertId}/read`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to mark alert as read");
    }

    return res.json();
  },

  /**
   * Mark all alerts as read
   */
  async markAllAlertsRead(): Promise<{ message: string; updated_count: number }> {
    const res = await fetch(`${API_BASE}/driver/alerts/read-all`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to mark all alerts as read");
    }

    return res.json();
  },

  /**
   * Formally acknowledge an emergency directive
   */
  async acknowledgeAlert(alertId: string, notes?: string): Promise<DriverAlert> {
    const res = await fetch(`${API_BASE}/driver/alerts/${alertId}/acknowledge`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes: notes || "Acknowledged by Driver via mobile interface" }),
    });

    if (!res.ok) {
      throw new Error("Failed to acknowledge alert");
    }

    return res.json();
  },

  /**
   * Dismiss alert from active view
   */
  async dismissAlert(alertId: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/driver/alerts/${alertId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to dismiss alert");
    }

    return res.json();
  },

  /**
   * Fetch notification preferences
   */
  async getPreferences(): Promise<NotificationPreference> {
    const res = await fetch(`${API_BASE}/driver/alerts/preferences/settings`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch notification preferences");
    }

    return res.json();
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(payload: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const res = await fetch(`${API_BASE}/driver/alerts/preferences/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to update notification preferences");
    }

    return res.json();
  },

  /**
   * Synchronize queued offline actions
   */
  async syncOfflineActions(actions: OfflineAlertAction[]): Promise<{ synced_count: number; message: string }> {
    const res = await fetch(`${API_BASE}/driver/alerts/sync-offline-actions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ actions }),
    });

    if (!res.ok) {
      throw new Error("Failed to sync offline alert actions");
    }

    return res.json();
  },
};

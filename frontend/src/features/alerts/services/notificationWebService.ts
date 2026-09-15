import { DriverAlert, AlertSeverity } from "../types/alertTypes";

export class NotificationWebService {
  /**
   * Check if browser Notification API is supported
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /**
   * Get current browser notification permission
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  /**
   * Request permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return "denied";
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn("Error requesting notification permission", e);
      return "denied";
    }
  }

  /**
   * Display system notification if permission is granted and alert is urgent
   */
  static showSystemNotification(alert: DriverAlert): void {
    if (!this.isSupported() || Notification.permission !== "granted") return;

    // Only show system notifications for Critical or High alerts
    if (alert.severity !== AlertSeverity.CRITICAL && alert.severity !== AlertSeverity.HIGH) {
      return;
    }

    try {
      const title = `🚨 [${alert.severity}] ${alert.title}`;
      const options: NotificationOptions = {
        body: alert.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: alert.id,
        requireInteraction: alert.severity === AlertSeverity.CRITICAL,
      };

      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        window.location.href = "/dashboard/driver/alerts";
      };
    } catch (err) {
      console.warn("Failed to display system notification", err);
    }
  }
}

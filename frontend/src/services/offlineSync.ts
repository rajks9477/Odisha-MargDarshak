import { GisService, OfflineLocationPing } from "@/services/gisService";
import { GpsTelemetry } from "@/services/locationService";

export interface QueuedOfflineRecord {
  localId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: string; // ISO String
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
}

const OFFLINE_QUEUE_KEY = "ner_driver_offline_gps_queue";

export class OfflineSyncService {
  private static isSyncing = false;

  /**
   * Get all queued records from local storage
   */
  public static getQueue(): QueuedOfflineRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Enqueue a new GPS telemetry point into offline local storage
   */
  public static enqueueLocation(gps: GpsTelemetry): QueuedOfflineRecord {
    const queue = this.getQueue();
    const newRecord: QueuedOfflineRecord = {
      localId: `loc-off-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy,
      speed: gps.speed,
      heading: gps.heading,
      timestamp: new Date(gps.timestamp).toISOString(),
      status: "PENDING",
    };

    // Keep queue size manageable (max 100 recent pings)
    const updated = [...queue, newRecord].slice(-100);
    if (typeof window !== "undefined") {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    }
    return newRecord;
  }

  /**
   * Returns count of unsynced records
   */
  public static getPendingCount(): number {
    return this.getQueue().filter((r) => r.status === "PENDING" || r.status === "FAILED").length;
  }

  /**
   * Synchronize pending records to server database
   */
  public static async syncPendingRecords(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    if (typeof window === "undefined" || !navigator.onLine) {
      return { success: false, syncedCount: 0 };
    }

    const queue = this.getQueue();
    const pending = queue.filter((r) => r.status === "PENDING" || r.status === "FAILED");

    if (pending.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;

    // Mark as SYNCING in local storage
    const syncingQueue = queue.map((r) =>
      pending.some((p) => p.localId === r.localId) ? { ...r, status: "SYNCING" as const } : r
    );
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(syncingQueue));

    try {
      const payload: OfflineLocationPing[] = pending.map((r) => ({
        local_id: r.localId,
        latitude: r.latitude,
        longitude: r.longitude,
        accuracy_meters: r.accuracy,
        speed_kmh: r.speed,
        heading_degrees: r.heading,
        client_timestamp: r.timestamp,
      }));

      const res = await GisService.syncOfflineBatch(payload);

      // Remove synced records to prevent duplication
      const remaining = this.getQueue().filter((r) => !res.synced_local_ids.includes(r.localId));
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));

      this.isSyncing = false;
      return { success: true, syncedCount: res.synced_count };
    } catch (err) {
      console.error("Failed to sync offline GPS records", err);
      // Revert to FAILED status
      const failedQueue = this.getQueue().map((r) =>
        pending.some((p) => p.localId === r.localId) ? { ...r, status: "FAILED" as const } : r
      );
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedQueue));
      this.isSyncing = false;
      return { success: false, syncedCount: 0 };
    }
  }

  /**
   * Listen for window online events to trigger auto-sync
   */
  public static initAutoSync(onSynced?: (count: number) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handleOnline = async () => {
      const res = await this.syncPendingRecords();
      if (res.success && res.syncedCount > 0 && onSynced) {
        onSynced(res.syncedCount);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }
}

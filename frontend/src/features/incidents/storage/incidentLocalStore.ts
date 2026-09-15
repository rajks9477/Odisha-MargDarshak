import {
  IncidentReportPayload,
  IncidentSyncItem,
} from "../types/incidentTypes";

const DRAFT_KEY = "ner_incident_draft_v1";
const SYNC_QUEUE_KEY = "ner_incident_sync_queue_v1";

export class IncidentLocalStore {
  /**
   * Save unfinished report draft
   */
  static saveDraft(draft: Partial<IncidentReportPayload>): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save incident draft to localStorage", e);
    }
  }

  /**
   * Load saved report draft
   */
  static getDraft(): Partial<IncidentReportPayload> | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Failed to read incident draft from localStorage", e);
      return null;
    }
  }

  /**
   * Clear report draft upon successful submission
   */
  static clearDraft(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn("Failed to clear incident draft", e);
    }
  }

  /**
   * Get all items currently in sync queue
   */
  static getSyncQueue(): IncidentSyncItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Failed to get sync queue", e);
      return [];
    }
  }

  /**
   * Add new offline incident to sync queue
   */
  static enqueueSync(item: IncidentSyncItem): void {
    if (typeof window === "undefined") return;
    const queue = this.getSyncQueue();
    // Prevent duplicate entries
    const filtered = queue.filter((q) => q.local_id !== item.local_id);
    filtered.push(item);
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to persist sync queue", e);
    }
  }

  /**
   * Update sync item status and error
   */
  static updateSyncItem(
    localId: string,
    updates: Partial<IncidentSyncItem>
  ): void {
    if (typeof window === "undefined") return;
    const queue = this.getSyncQueue();
    const updated = queue.map((item) =>
      item.local_id === localId ? { ...item, ...updates } : item
    );
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to update sync item", e);
    }
  }

  /**
   * Remove item from sync queue
   */
  static removeSyncItem(localId: string): void {
    if (typeof window === "undefined") return;
    const queue = this.getSyncQueue();
    const filtered = queue.filter((item) => item.local_id !== localId);
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to remove sync item", e);
    }
  }
}

import { IncidentLocalStore } from "../storage/incidentLocalStore";
import { incidentsApi } from "../api/incidentsApi";

export class IncidentSyncEngine {
  private static isSyncing = false;

  /**
   * Trigger synchronization of all queued offline incidents
   */
  static async processSyncQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    if (this.isSyncing) return { syncedCount: 0, failedCount: 0 };
    if (typeof window !== "undefined" && !navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    const queue = IncidentLocalStore.getSyncQueue();
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      if (item.sync_status === "SYNCED") continue;

      // Exponential backoff check (skip if retried too recently)
      if (item.retry_count >= 5) {
        IncidentLocalStore.updateSyncItem(item.local_id, {
          sync_status: "FAILED",
          last_error: "Maximum sync retry limit reached (5 attempts)",
        });
        failedCount++;
        continue;
      }

      IncidentLocalStore.updateSyncItem(item.local_id, {
        sync_status: "UPLOADING",
      });

      try {
        const uploadedUrls: string[] = [];

        // 1. Upload base64 photos to server if any
        for (const photo of item.photos) {
          const byteString = atob(photo.base64.split(",")[1] || photo.base64);
          const mimeString = photo.type || "image/jpeg";
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });

          const uploadResult = await incidentsApi.uploadGeneralMedia(blob, photo.name);
          if (uploadResult.url) {
            uploadedUrls.push(uploadResult.url);
          }
        }

        // 2. Submit Incident with server photo URLs
        const finalPayload = {
          ...item.report,
          evidence_urls: uploadedUrls,
          is_offline_submission: true,
        };

        const created = await incidentsApi.createIncident(finalPayload);

        // 3. If voice note was present, upload voice note
        if (item.voice_note) {
          try {
            const byteString = atob(item.voice_note.base64.split(",")[1] || item.voice_note.base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: item.voice_note.type || "audio/webm" });
            await incidentsApi.uploadVoice(created.id, blob, item.voice_note.transcript);
          } catch (voiceErr) {
            console.warn("Offline voice note upload failed after incident creation", voiceErr);
          }
        }

        // 4. Mark as synced and cleanup
        IncidentLocalStore.updateSyncItem(item.local_id, {
          sync_status: "SYNCED",
          server_incident_id: created.id,
        });
        IncidentLocalStore.removeSyncItem(item.local_id);
        syncedCount++;
      } catch (err: any) {
        console.error(`Failed to sync incident ${item.local_id}:`, err);
        IncidentLocalStore.updateSyncItem(item.local_id, {
          sync_status: "FAILED",
          retry_count: item.retry_count + 1,
          last_error: err.message || "Network error during sync",
        });
        failedCount++;
      }
    }

    this.isSyncing = false;
    return { syncedCount, failedCount };
  }
}

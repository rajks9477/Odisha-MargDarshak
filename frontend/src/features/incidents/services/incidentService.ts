import {
  IncidentReportPayload,
  IncidentReportRecord,
  IncidentSyncItem,
} from "../types/incidentTypes";
import { incidentsApi } from "../api/incidentsApi";
import { IncidentLocalStore } from "../storage/incidentLocalStore";
import { IncidentSyncEngine } from "../sync/incidentSync";
import { MediaService } from "./mediaService";

export class IncidentService {
  /**
   * Submit incident online or queue offline
   */
  static async submitIncident(
    payload: IncidentReportPayload,
    photos: { file: File; dataUrl: string }[] = [],
    voiceRecording?: { blob: Blob; transcript?: string }
  ): Promise<{ record?: IncidentReportRecord; queuedLocally: boolean; localId?: string }> {
    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      // Offline fallback: package photos as base64 and queue
      const localId = `local_inc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const base64Photos = await Promise.all(
        photos.map(async (p) => ({
          name: p.file.name,
          base64: await MediaService.fileToBase64(p.file),
          type: p.file.type,
        }))
      );

      let voiceNote = undefined;
      if (voiceRecording) {
        voiceNote = {
          name: `voice_${Date.now()}.webm`,
          base64: await MediaService.fileToBase64(voiceRecording.blob),
          type: voiceRecording.blob.type || "audio/webm",
          transcript: voiceRecording.transcript,
        };
      }

      const syncItem: IncidentSyncItem = {
        local_id: localId,
        report: payload,
        photos: base64Photos,
        voice_note: voiceNote,
        created_at: new Date().toISOString(),
        retry_count: 0,
        sync_status: "PENDING",
      };

      IncidentLocalStore.enqueueSync(syncItem);
      IncidentLocalStore.clearDraft();

      return { queuedLocally: true, localId };
    }

    // Online submission flow:
    // 1. Upload photos first
    const uploadedUrls: string[] = [];
    for (const p of photos) {
      try {
        const res = await incidentsApi.uploadGeneralMedia(p.file, p.file.name);
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      } catch (uploadErr) {
        console.warn("Individual photo upload failed during submission", uploadErr);
      }
    }

    const finalPayload: IncidentReportPayload = {
      ...payload,
      evidence_urls: uploadedUrls,
    };

    // 2. Create Incident Record
    const record = await incidentsApi.createIncident(finalPayload);

    // 3. Upload Voice Recording if attached
    if (voiceRecording && record.id) {
      try {
        await incidentsApi.uploadVoice(record.id, voiceRecording.blob, voiceRecording.transcript);
      } catch (voiceErr) {
        console.warn("Voice note upload failed after incident creation", voiceErr);
      }
    }

    IncidentLocalStore.clearDraft();
    return { record, queuedLocally: false };
  }

  /**
   * Fetch driver incidents
   */
  static async getMyIncidents(): Promise<IncidentReportRecord[]> {
    return incidentsApi.getMyIncidents();
  }

  /**
   * Get incident detail
   */
  static async getIncidentDetail(id: string): Promise<IncidentReportRecord> {
    return incidentsApi.getIncidentDetail(id);
  }

  /**
   * Sync offline items
   */
  static async syncOfflineReports() {
    return IncidentSyncEngine.processSyncQueue();
  }
}

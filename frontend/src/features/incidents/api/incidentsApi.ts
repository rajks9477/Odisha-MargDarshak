import {
  IncidentReportPayload,
  IncidentReportRecord,
  IncidentEvidenceItem,
} from "../types/incidentTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const incidentsApi = {
  /**
   * Submit new incident report
   */
  async createIncident(payload: IncidentReportPayload): Promise<IncidentReportRecord> {
    const response = await fetch(`${API_BASE_URL}/driver/incidents`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Failed to submit incident" }));
      throw new Error(err.detail || "Failed to submit incident");
    }

    return response.json();
  },

  /**
   * Upload incident photo/media
   */
  async uploadMedia(incidentId: string, file: File | Blob, fileName: string): Promise<IncidentEvidenceItem> {
    const formData = new FormData();
    formData.append("file", file, fileName);

    const headers = getAuthHeaders();
    // Do not set Content-Type header manually for FormData
    delete (headers as Record<string, string>)["Content-Type"];

    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/media`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Media upload failed" }));
      throw new Error(err.detail || "Media upload failed");
    }

    return response.json();
  },

  /**
   * Upload general media before incident submission (pre-upload)
   */
  async uploadGeneralMedia(file: File | Blob, fileName: string): Promise<{ url: string; file_name: string; file_size: number; media_type: string }> {
    const formData = new FormData();
    formData.append("file", file, fileName);

    const headers = getAuthHeaders();
    delete (headers as Record<string, string>)["Content-Type"];

    const response = await fetch(`${API_BASE_URL}/incidents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Media pre-upload failed" }));
      throw new Error(err.detail || "Media pre-upload failed");
    }

    return response.json();
  },

  /**
   * Upload voice note with optional transcript
   */
  async uploadVoice(incidentId: string, audioBlob: Blob, transcript?: string): Promise<IncidentReportRecord> {
    const formData = new FormData();
    formData.append("file", audioBlob, `voice_${Date.now()}.webm`);
    if (transcript) {
      formData.append("transcript", transcript);
    }

    const headers = getAuthHeaders();
    delete (headers as Record<string, string>)["Content-Type"];

    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/voice`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Voice upload failed" }));
      throw new Error(err.detail || "Voice upload failed");
    }

    return response.json();
  },

  /**
   * Get driver's own submitted incidents
   */
  async getMyIncidents(): Promise<IncidentReportRecord[]> {
    const response = await fetch(`${API_BASE_URL}/incidents/my`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch driver incidents");
    }

    return response.json();
  },

  /**
   * Get incident detail
   */
  async getIncidentDetail(incidentId: string): Promise<IncidentReportRecord> {
    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch incident details");
    }

    return response.json();
  },

  /**
   * Get incident verification status
   */
  async getIncidentStatus(incidentId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch incident status");
    }

    return response.json();
  },
};

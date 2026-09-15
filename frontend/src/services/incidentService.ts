import { ApiClient } from "@/lib/api";

export enum IncidentType {
  FLOOD = "FLOOD",
  LANDSLIDE = "LANDSLIDE",
  ROAD_BLOCKAGE = "ROAD_BLOCKAGE",
  BRIDGE_DAMAGE = "BRIDGE_DAMAGE",
  ACCIDENT = "ACCIDENT",
  HEAVY_TRAFFIC = "HEAVY_TRAFFIC",
  ROAD_DAMAGE = "ROAD_DAMAGE",
  FALLEN_TREE = "FALLEN_TREE",
  VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
  OTHER = "OTHER",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IncidentStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  RECEIVED = "RECEIVED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  UNDER_REVIEW = "UNDER_REVIEW",
  VERIFIED = "VERIFIED",
  ACTIONED = "ACTIONED",
  REJECTED = "REJECTED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  DUPLICATE = "DUPLICATE",
}

export interface IncidentEvidenceItem {
  id: string;
  incident_id: string;
  file_url: string;
  file_name: string;
  media_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface IncidentAuditLogItem {
  id: string;
  incident_id: string;
  user_id: string;
  user_name?: string;
  user_role: string;
  action: string;
  old_status?: string;
  new_status: string;
  notes?: string;
  timestamp: string;
}

export interface IncidentReport {
  id: string;
  client_idempotency_key?: string;
  reporter_id: string;
  reporter_name?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  trip_id?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  voice_transcript?: string;
  latitude: number;
  longitude: number;
  gps_accuracy?: number;
  road_id?: string;
  road_name?: string;
  district_id?: string;
  district_name?: string;
  state?: string;
  status: IncidentStatus;
  evidence_quality_score: number;
  is_offline_submission: boolean;
  is_possible_duplicate: boolean;
  parent_incident_id?: string;
  review_notes?: string;
  rejection_reason?: string;
  resolution_notes?: string;
  verified_by?: string;
  resolved_by?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  resolved_at?: string;
}

export interface IncidentDetail extends IncidentReport {
  evidence: IncidentEvidenceItem[];
  audit_logs: IncidentAuditLogItem[];
  nearby_duplicate_count: number;
}

export interface IncidentCreatePayload {
  client_idempotency_key?: string;
  type: IncidentType;
  severity?: IncidentSeverity;
  description: string;
  voice_transcript?: string;
  latitude: number;
  longitude: number;
  gps_accuracy?: number;
  trip_id?: string;
  is_offline_submission?: boolean;
  evidence_urls?: string[];
}

export const IncidentService = {
  async reportIncident(payload: IncidentCreatePayload): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>("/driver/incidents", payload);
  },

  async createIncident(payload: IncidentCreatePayload): Promise<IncidentReport> {
    return await this.reportIncident(payload);
  },

  async getDriverIncidents(): Promise<IncidentReport[]> {
    return await ApiClient.get<IncidentReport[]>("/driver/incidents");
  },

  async getMyReports(): Promise<IncidentReport[]> {
    return await this.getDriverIncidents();
  },

  async getIncidentDetail(incidentId: string): Promise<IncidentDetail> {
    return await ApiClient.get<IncidentDetail>(`/driver/incidents/${incidentId}`);
  },

  async getPendingIncidents(): Promise<IncidentReport[]> {
    return await ApiClient.get<IncidentReport[]>("/officer/incidents/pending");
  },

  async cancelIncident(incidentId: string, reason: string): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>(`/incidents/${incidentId}/cancel`, {
      rejection_reason: reason,
    });
  },

  async uploadEvidence(incidentId: string, file: File): Promise<IncidentEvidenceItem> {
    const formData = new FormData();
    formData.append("file", file);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`http://127.0.0.1:8000/api/v1/incidents/${incidentId}/evidence`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Failed to upload evidence");
    }
    return await res.json();
  },

  async verifyIncident(
    incidentId: string,
    notes: string,
    actionTaken: string = "PWD_EARTHMOVERS_DEPLOYED",
    correctSeverity?: IncidentSeverity
  ): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>(`/officer/incidents/${incidentId}/verify`, {
      verification_notes: notes,
      action_taken: actionTaken,
      correct_severity: correctSeverity,
    });
  },

  async rejectIncident(incidentId: string, reason: string): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>(`/officer/incidents/${incidentId}/reject`, {
      rejection_reason: reason,
    });
  },

  async requestInfo(incidentId: string, message: string): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>(`/officer/incidents/${incidentId}/request-info`, {
      inquiry_message: message,
    });
  },

  async resolveIncident(
    incidentId: string,
    notes: string,
    reopenedStatus: "GREEN" | "YELLOW" = "GREEN"
  ): Promise<IncidentReport> {
    return await ApiClient.post<IncidentReport>(`/officer/incidents/${incidentId}/resolve`, {
      resolution_notes: notes,
      reopened_road_status: reopenedStatus,
    });
  },

  async syncOfflineBatch(reports: IncidentCreatePayload[]): Promise<{ synced_count: number; reports: IncidentReport[] }> {
    return await ApiClient.post<{ synced_count: number; reports: IncidentReport[] }>("/driver/incidents/sync-offline", {
      reports,
    });
  },
};

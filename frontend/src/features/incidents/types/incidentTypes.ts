export enum IncidentType {
  LANDSLIDE = "LANDSLIDE",
  FLOOD = "FLOOD",
  ROAD_BLOCKAGE = "ROAD_BLOCKAGE",
  ACCIDENT = "ACCIDENT",
  BRIDGE_DAMAGE = "BRIDGE_DAMAGE",
  ROAD_DAMAGE = "ROAD_DAMAGE",
  DEBRIS = "DEBRIS",
  VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
  WEATHER_HAZARD = "WEATHER_HAZARD",
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
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  UNDER_REVIEW = "UNDER_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  DUPLICATE = "DUPLICATE",
}

export type LocationSource = "GPS" | "MANUAL";

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  location_source: LocationSource;
  road_id?: string;
  road_name?: string;
  district_name?: string;
}

export interface IncidentEvidenceItem {
  id?: string;
  file_url: string;
  file_name: string;
  media_type: string;
  file_size_bytes?: number;
  preview_url?: string;
  blob?: Blob;
}

export interface IncidentReportPayload {
  client_idempotency_key?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  voice_transcript?: string;
  latitude: number;
  longitude: number;
  gps_accuracy?: number;
  location_source?: LocationSource;
  trip_id?: string;
  is_offline_submission?: boolean;
  evidence_urls?: string[];
}

export interface IncidentReportRecord {
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
  location_source: LocationSource;
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
  evidence?: IncidentEvidenceItem[];
}

export interface IncidentSyncItem {
  local_id: string;
  report: IncidentReportPayload;
  photos: { name: string; base64: string; type: string }[];
  voice_note?: { name: string; base64: string; type: string; transcript?: string };
  created_at: string;
  retry_count: number;
  sync_status: "PENDING" | "UPLOADING" | "SYNCED" | "FAILED" | "PARTIALLY_SYNCED";
  last_error?: string;
  server_incident_id?: string;
}

export interface VoiceRecordingResult {
  audioBlob: Blob;
  audioUrl: string;
  transcript: string;
  language: string;
  confidence: number;
  durationSeconds: number;
}

export type Incident = IncidentReportRecord;

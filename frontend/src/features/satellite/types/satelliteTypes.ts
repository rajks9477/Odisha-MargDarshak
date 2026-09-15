export interface SatelliteScene {
  id: string;
  satellite_source: string;
  sensor_type: string;
  acquisition_date: string;
  cloud_cover_pct: number;
  resolution_meters: number;
  target_district: string;
  state: string;
  data_provenance: string;
}

export interface SatelliteChangeDetection {
  id: string;
  road_id: string;
  road_name: string;
  pre_event_date: string;
  post_event_date: string;
  anomaly_type: string;
  affected_area_sqm: number;
  confidence_score: number;
  verification_status: string;
  detected_at: string;
  model_version: string;
  summary: string;
}

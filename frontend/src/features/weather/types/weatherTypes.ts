export interface WeatherObservation {
  id: string;
  location_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  rainfall_1h_mm: number;
  rainfall_6h_mm: number;
  rainfall_24h_mm: number;
  rainfall_7d_mm: number;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  visibility_meters: number;
  weather_warning_level: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  recorded_at: string;
  source: string;
  data_quality: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  hazard_type: "LANDSLIDE" | "FLASH_FLOOD" | "CLOUD_BURST" | "RIVER_OVERFLOW" | "EARTHQUAKE" | "CYCLONE_WIND";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "MONITORED" | "RESOLVED";
  district: string;
  state: string;
  affected_highway: string;
  description: string;
  recommended_action?: string;
  latitude: number;
  longitude: number;
  issued_by: string;
  issued_at: string;
  valid_until?: string;
  source: string;
  data_quality: string;
}

export interface RegionalWeatherSummary {
  state: string;
  district: string;
  primary_condition: string;
  temperature_range_c: string;
  max_rainfall_24h_mm: number;
  active_warning_level: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  active_disasters_count: number;
  data_source: string;
  last_updated: string;
}

export interface DataSourceMetadata {
  id: string;
  name: string;
  type: string;
  covered_states: string[];
  data_quality: string;
  status: string;
}

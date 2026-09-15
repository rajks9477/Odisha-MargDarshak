export interface MasterEntitySummary {
  total_roads: number;
  total_bridges: number;
  total_facilities: number;
  total_warehouses: number;
  total_vehicles: number;
  active_facilities_count: number;
  archived_facilities_count: number;
  data_provenance: string;
}

export interface MasterFacility {
  id: string;
  name: string;
  facility_type: string;
  state: string;
  district: string;
  address?: string;
  latitude: number;
  longitude: number;
  capacity_metric?: string;
  contact_phone?: string;
  nodal_officer?: string;
  status: string;
  data_provenance: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BulkImportResult {
  total_processed: number;
  created_count: number;
  skipped_duplicates: number;
  errors: string[];
}

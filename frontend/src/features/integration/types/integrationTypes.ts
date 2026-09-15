export interface IntegrationHubSummary {
  total_connectors: number;
  healthy_connectors: number;
  total_ingested_records: number;
  data_freshness_pct: number;
  active_pipelines_count: number;
  data_provenance: string;
}

export interface ExternalConnector {
  id: string;
  name: string;
  connector_type: string;
  endpoint_url: string;
  auth_type: string;
  refresh_interval_minutes: number;
  geographic_coverage: string;
  license_type: string;
  status: string;
  last_sync_at?: string;
  last_success_at?: string;
  total_records_ingested: number;
  error_count: number;
  is_active: boolean;
  data_provenance: string;
}

export interface IngestionBatch {
  id: string;
  connector_id: string;
  connector_name: string;
  status: string;
  records_received: number;
  records_promoted: number;
  records_failed: number;
  error_summary?: string;
  duration_ms: number;
  created_at: string;
}

export interface ConnectorSyncResult {
  connector_id: string;
  batch_id: string;
  status: string;
  records_promoted: number;
  duration_ms: number;
  message: string;
}

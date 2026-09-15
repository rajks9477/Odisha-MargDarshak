import {
  IntegrationHubSummary,
  ExternalConnector,
  IngestionBatch,
  ConnectorSyncResult,
} from "../types/integrationTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const integrationApi = {
  /**
   * Fetch hub summary metrics
   */
  async getSummary(): Promise<IntegrationHubSummary> {
    const res = await fetch(`${API_BASE}/integration/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch integration summary");
    return res.json();
  },

  /**
   * List all registered external connectors
   */
  async getConnectors(): Promise<ExternalConnector[]> {
    const res = await fetch(`${API_BASE}/integration/connectors`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Trigger on-demand sync for a connector
   */
  async syncConnector(connectorId: string): Promise<ConnectorSyncResult> {
    const res = await fetch(`${API_BASE}/integration/connectors/${connectorId}/sync`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Sync execution failed");
    return res.json();
  },

  /**
   * List ingestion execution batch logs
   */
  async getBatches(): Promise<IngestionBatch[]> {
    const res = await fetch(`${API_BASE}/integration/batches`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },
};

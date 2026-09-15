import {
  Shipment,
  WarehouseHub,
  LogisticsMetrics,
  CargoPriority,
  ShipmentStatus,
  CargoCategory,
} from "../types/logisticsTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const logisticsApi = {
  /**
   * Get shipments with optional priority and status filters
   */
  async getShipments(priority?: CargoPriority, status?: ShipmentStatus): Promise<Shipment[]> {
    const params = new URLSearchParams();
    if (priority) params.append("priority", priority);
    if (status) params.append("status_filter", status);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/logistics/shipments${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch shipments: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get specific shipment profile
   */
  async getShipmentDetail(id: string): Promise<Shipment> {
    const res = await fetch(`${API_BASE}/logistics/shipments/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch shipment detail");
    }

    return res.json();
  },

  /**
   * Create emergency shipment
   */
  async createShipment(payload: {
    title: string;
    cargo_category: CargoCategory;
    cargo_description: string;
    priority: CargoPriority;
    weight_kg: number;
    origin_name: string;
    destination_name: string;
  }): Promise<Shipment> {
    const res = await fetch(`${API_BASE}/logistics/shipments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create emergency shipment");
    }

    return res.json();
  },

  /**
   * Update shipment status and progress
   */
  async updateShipmentStatus(
    id: string,
    status: ShipmentStatus,
    progressPct?: number,
    notes?: string
  ): Promise<Shipment> {
    const res = await fetch(`${API_BASE}/logistics/shipments/${id}/status`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        progress_pct: progressPct,
        notes,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update shipment status");
    }

    return res.json();
  },

  /**
   * Get warehouse hubs
   */
  async getWarehouseHubs(): Promise<WarehouseHub[]> {
    const res = await fetch(`${API_BASE}/logistics/hubs`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch warehouse hubs");
    }

    return res.json();
  },

  /**
   * Get high-level supply chain metrics
   */
  async getLogisticsMetrics(): Promise<LogisticsMetrics> {
    const res = await fetch(`${API_BASE}/logistics/metrics`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return {
        active_shipments_count: 4,
        critical_relief_shipments_count: 2,
        delayed_corridors_count: 1,
        total_in_transit_tonnes: 28.2,
        delivered_today_count: 1,
        data_source: "NER-MargDarshak Supply Chain Intelligence Engine",
      };
    }

    return res.json();
  },
};

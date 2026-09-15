import {
  AnalyticsOverview,
  TrendDataPoint,
  DecisionSupportItem,
  GeneratedReport,
} from "../types/analyticsTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const analyticsApi = {
  /**
   * Fetch overview analytics KPIs and period comparison
   */
  async getOverview(state?: string): Promise<AnalyticsOverview> {
    const query = state ? `?state=${encodeURIComponent(state)}` : "";
    const res = await fetch(`${API_BASE}/analytics/overview${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch analytics overview: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Fetch multi-week incident and delay trends
   */
  async getTrends(): Promise<TrendDataPoint[]> {
    const res = await fetch(`${API_BASE}/analytics/trends`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },

  /**
   * Fetch strategic decision support recommendations
   */
  async getDecisionSupport(state?: string): Promise<DecisionSupportItem[]> {
    const query = state ? `?state=${encodeURIComponent(state)}` : "";
    const res = await fetch(`${API_BASE}/analytics/decision-support${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },

  /**
   * Generate a formal government report
   */
  async generateReport(
    reportTitle?: string,
    reportType: string = "CORRIDOR_DISRUPTION_SUMMARY",
    stateFilter: string = "ALL"
  ): Promise<GeneratedReport> {
    const res = await fetch(`${API_BASE}/analytics/reports/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        report_title: reportTitle || "Regional Infrastructure & Route Disruption Audit",
        report_type: reportType,
        state_filter: stateFilter,
      }),
    });

    if (!res.ok) {
      throw new Error("Report generation failed");
    }

    return res.json();
  },

  /**
   * List generated reports
   */
  async getReports(): Promise<GeneratedReport[]> {
    const res = await fetch(`${API_BASE}/analytics/reports`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },
};

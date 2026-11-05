import {
  WeatherObservation,
  DisasterAlert,
  RegionalWeatherSummary,
  DataSourceMetadata,
} from "../types/weatherTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const weatherApi = {
  /**
   * Get weather for specific location/district
   */
  async getDistrictWeather(location?: string): Promise<WeatherObservation> {
    const query = location ? `?location=${encodeURIComponent(location)}` : "";
    const res = await fetch(`${API_BASE}/weather/district${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch district weather: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Get regional summaries across 8 NE states
   */
  async getRegionalSummaries(): Promise<RegionalWeatherSummary[]> {
    const res = await fetch(`${API_BASE}/weather/regional-summary`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch regional weather summary");
    }

    return res.json();
  },

  /**
   * Get active disaster alerts
   */
  async getActiveDisasters(): Promise<DisasterAlert[]> {
    const res = await fetch(`${API_BASE}/weather/disasters/active`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch active disaster alerts");
    }

    return res.json();
  },

  /**
   * Get data sources & telemetry registry
   */
  async getDataSources(): Promise<DataSourceMetadata[]> {
    const res = await fetch(`${API_BASE}/weather/sources`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [
        {
          id: "IMD-BHUBANESWAR-MC",
          name: "India Meteorological Department (IMD) Meteorological Centre, Bhubaneswar",
          type: "AUTOMATIC_WEATHER_STATION",
          covered_states: ["Odisha"],
          data_quality: "VERIFIED_GOVT_SIMULATION",
          status: "OPERATIONAL",
        },
      ];
    }

    return res.json();
  },
};

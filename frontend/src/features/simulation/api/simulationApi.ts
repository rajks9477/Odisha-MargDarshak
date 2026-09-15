import { SimulationResult, SimulationScenario, CreateSimulationRequest } from "../types/simulationTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const simulationApi = {
  /**
   * Run a new What-If disaster simulation scenario
   */
  async runSimulation(payload: CreateSimulationRequest): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/simulation/scenarios`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Simulation execution failed: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * List saved simulation scenarios
   */
  async getScenarios(): Promise<SimulationScenario[]> {
    const res = await fetch(`${API_BASE}/simulation/scenarios`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },

  /**
   * Compare two scenarios side-by-side
   */
  async compareScenarios(scenarioId1: string, scenarioId2: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/compare`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        scenario_id_1: scenarioId1,
        scenario_id_2: scenarioId2,
      }),
    });

    if (!res.ok) {
      throw new Error("Scenario comparison failed");
    }

    return res.json();
  },
};

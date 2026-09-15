import { CopilotResponse, ProposedAction } from "../types/copilotTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const copilotApi = {
  /**
   * Send text query to RAG AI Copilot
   */
  async sendQuery(query: string, conversationId?: string, contextDistrict?: string): Promise<CopilotResponse> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        context_district: contextDistrict,
      }),
    });

    if (!res.ok) {
      throw new Error(`Copilot query failed: ${res.statusText}`);
    }

    return res.json();
  },

  /**
   * Send voice note / speech-to-text query
   */
  async sendVoiceQuery(transcript: string, conversationId?: string): Promise<CopilotResponse> {
    const formData = new FormData();
    formData.append("transcript", transcript);
    if (conversationId) formData.append("conversation_id", conversationId);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_BASE}/copilot/voice-query`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Voice copilot query failed");
    }

    return res.json();
  },

  /**
   * Authorize or reject AI proposed action
   */
  async approveAction(
    actionType: string,
    targetResourceId: string,
    decision: "APPROVED" | "REJECTED" = "APPROVED",
    notes?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/actions/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action_type: actionType,
        target_resource_id: targetResourceId,
        officer_decision: decision,
        officer_notes: notes,
      }),
    });

    if (!res.ok) {
      throw new Error("Action approval failed");
    }

    return res.json();
  },

  /**
   * Get role-tailored sample prompts
   */
  async getSamplePrompts(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/copilot/sample-prompts`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [
        "Which highway corridors are currently blocked by landslides?",
        "How many critical medicine shipments are delayed today?",
        "What districts are affected by the NH-6 Sonapur disruption?",
      ];
    }

    return res.json();
  },
};

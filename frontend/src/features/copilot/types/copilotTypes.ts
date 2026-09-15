export interface ProposedAction {
  action_type: string;
  title: string;
  description: string;
  target_resource_id: string;
  payload: Record<string, any>;
  requires_human_approval: boolean;
  status: string;
}

export interface CopilotResponse {
  answer: string;
  intent: string;
  tools_used: string[];
  data_sources: string[];
  confidence_score: number;
  verified_data_summary?: Record<string, any>;
  proposed_action?: ProposedAction;
  conversation_id: string;
  timestamp: string;
  data_provenance: string;
}

export interface ChatMessage {
  id: string;
  sender: "USER" | "COPILOT";
  text: string;
  responsePayload?: CopilotResponse;
  timestamp: string;
  isVoice?: boolean;
}

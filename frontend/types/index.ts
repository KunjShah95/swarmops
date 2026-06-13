export interface Agent {
  id: string;
  name: string;
  role: string;
  status:
    | "Thinking"
    | "Analyzing"
    | "Waiting"
    | "Completed"
    | "idle"
    | "speaking"
    | "running";
  avatar: string;
  key?: string;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  message: string;
  avatar: string;
  type?: string;
}

export interface Insight {
  id: string;
  title: string;
  value: number | string;
  trend?: string;
  description: string;
  color?: string;
}

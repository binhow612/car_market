export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "action" | "suggestion";
  actions?: MessageAction[];
  data?: any; // For custom data like valuation_form, car_comparison, etc.
}

export interface MessageAction {
  label: string;
  action: string;
  data?: any;
}

export interface AssistantContext {
  currentPage: string;
  userRole?: "user" | "admin";
  isAuthenticated: boolean;
  lastAction?: string;
}

export interface AssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  isTyping: boolean;
  unreadCount: number;
}

export interface SuggestionChip {
  id: string;
  label: string;
  query: string;
  icon?: string;
}

export interface AssistantResponse {
  message: string;
  suggestions?: SuggestionChip[];
  actions?: MessageAction[];
}


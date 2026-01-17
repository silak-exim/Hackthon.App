/**
 * Chat request model
 */
export interface ChatRequest {
  question: string;
  context?: string;
}

/**
 * Chat response from API
 */
export interface ChatResponse {
  success: boolean;
  answer: string;
  summary?: string;
  timestamp?: Date;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  timestamp: Date;
  version: string;
}

/**
 * Chat message for display
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


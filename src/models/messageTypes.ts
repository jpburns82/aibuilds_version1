export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

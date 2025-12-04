export type AgentRole = 'analyst' | 'architect' | 'coder' | 'qa' | 'leadArchitect';

export type ModelProvider = 'openai' | 'anthropic';

export interface AgentConfig {
  name: AgentRole;
  model: string;
  provider: ModelProvider;
}

export interface AgentOutput {
  role: AgentRole;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface PipelineContext {
  userPrompt: string;
  analystOutput?: AgentOutput;
  architectOutput?: AgentOutput;
  coderOutput?: AgentOutput;
  qaOutput?: AgentOutput;
  leadArchitectOutput?: AgentOutput;
}

export interface Decision {
  status: 'APPROVED' | 'REJECTED';
  finalDeliverable?: string;
  revisionInstructions?: string[];
  reasoning: string;
}

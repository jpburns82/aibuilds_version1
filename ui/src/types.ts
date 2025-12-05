/**
 * UI Types for AI-Builds Workbench
 */

export type ProjectMode = 'prototype' | 'mvp' | 'production';

export type AgentRole = 'analyst' | 'architect' | 'coder' | 'qa' | 'leadArchitect';

export type PipelineStatus = 'idle' | 'running' | 'completed' | 'error' | 'blocked';

export interface AgentMessage {
  id: string;
  agentRole: AgentRole;
  content: string;
  timestamp: Date;
}

export interface PipelineState {
  status: PipelineStatus;
  currentAgent: AgentRole | null;
  projectName: string | null;
  projectMode: ProjectMode;
  blueprintPath: string | null;
  messages: AgentMessage[];
  error: string | null;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export interface ValidationViolation {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationReport {
  valid: boolean;
  violations: ValidationViolation[];
  warnings: ValidationViolation[];
  info: ValidationViolation[];
  summary: {
    totalViolations: number;
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
  testedAt: Date;
  profile: string;
}

export interface VMRun {
  id: string;
  language: 'js' | 'ts';
  code: string;
  status: 'pending' | 'running' | 'success' | 'error';
  output: string;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

export const AGENT_COLORS: Record<AgentRole, string> = {
  analyst: 'var(--accent-purple)',
  architect: 'var(--accent-blue)',
  coder: 'var(--accent-green)',
  qa: 'var(--accent-orange)',
  leadArchitect: 'var(--accent-gold)',
};

export const AGENT_LABELS: Record<AgentRole, string> = {
  analyst: 'Analyst',
  architect: 'Architect',
  coder: 'Coder',
  qa: 'QA',
  leadArchitect: 'Lead Architect',
};

// ChatGPT Ideation Types
export interface BuildPlanPacket {
  projectName?: string;
  projectGoal?: string;
  features?: string[];
  strictnessMode?: ProjectMode;
  technicalStack?: string[];
  constraints?: string[];
  expectedDeliverables?: string[];
  phase?: 'ideation' | 'planning' | 'ready-to-build';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  history: ChatMessage[];
  plan: BuildPlanPacket;
  readyToBuild: boolean;
  loading: boolean;
  error: string | null;
}

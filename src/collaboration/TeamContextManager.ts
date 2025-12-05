/**
 * TeamContextManager - Foundation for Agent-to-Agent Awareness
 *
 * PHASE 3 - IMPLEMENTATION COMPLETE
 *
 * Purpose: Manages shared context between agents during workflow execution
 * Scope: Full implementation for team collaboration
 * Status: Complete
 *
 * Architecture Rule: Agents may observe but NOT modify each other's outputs
 */

import { AgentRole, AgentOutput } from '../models/agentTypes';

/**
 * Represents shared context visible to all agents
 * READ-ONLY for agents, managed by orchestrator
 */
export interface TeamContext {
  /** Unique identifier for this team session */
  sessionId: string;

  /** Original user prompt that started this workflow */
  userPrompt: string;

  /** All agent outputs produced so far (read-only) */
  agentOutputs: AgentOutput[];

  /** Current workflow stage */
  stage: WorkflowStage;

  /** Metadata about the current session */
  metadata: {
    startedAt: Date;
    currentAgent?: AgentRole;
    completedAgents: AgentRole[];
  };
}

/**
 * Workflow stages for team collaboration
 */
export enum WorkflowStage {
  ANALYSIS = 'analysis',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  REVIEW = 'review',
  DECISION = 'decision',
  COMPLETE = 'complete',
}

/**
 * Interface for reading team context
 * Agents receive this view (read-only)
 */
export interface TeamContextView {
  /** Session identifier */
  sessionId: string;

  /** Original prompt */
  userPrompt: string;

  /** Previous agent outputs (cannot modify) */
  previousOutputs: ReadonlyArray<Readonly<AgentOutput>>;

  /** Current workflow stage */
  currentStage: WorkflowStage;

  /** Which agents have completed their work */
  completedAgents: ReadonlyArray<AgentRole>;
}

/**
 * TeamContextManager - Manages shared context
 *
 * IMPLEMENTATION (Phase 3):
 * - Only orchestrator can create/update context
 * - Agents receive read-only views via getContextView()
 * - No agent can modify another agent's output
 * - Enforces single-responsibility principle
 * - Singleton pattern for shared state
 */
export class TeamContextManager {
  private context: TeamContext | null = null;

  /**
   * Initialize a new team context for a workflow
   * ORCHESTRATOR ONLY
   */
  initializeContext(sessionId: string, userPrompt: string): TeamContext {
    this.context = {
      sessionId,
      userPrompt,
      agentOutputs: [],
      stage: WorkflowStage.ANALYSIS,
      metadata: {
        startedAt: new Date(),
        completedAgents: [],
      },
    };
    return this.context;
  }

  /**
   * Add an agent's output to the shared context
   * ORCHESTRATOR ONLY
   */
  addAgentOutput(output: AgentOutput): void {
    if (!this.context) {
      throw new Error('Context not initialized. Call initializeContext first.');
    }
    this.context.agentOutputs.push(output);
  }

  /**
   * Get a read-only view of the context for an agent
   * Agents can call this to see what others have done
   */
  getContextView(): TeamContextView {
    if (!this.context) {
      throw new Error('Context not initialized. Call initializeContext first.');
    }

    return {
      sessionId: this.context.sessionId,
      userPrompt: this.context.userPrompt,
      previousOutputs: this.context.agentOutputs as ReadonlyArray<
        Readonly<AgentOutput>
      >,
      currentStage: this.context.stage,
      completedAgents: this.context.metadata
        .completedAgents as ReadonlyArray<AgentRole>,
    };
  }

  /**
   * Update the current workflow stage
   * ORCHESTRATOR ONLY
   */
  updateStage(stage: WorkflowStage): void {
    if (!this.context) {
      throw new Error('Context not initialized. Call initializeContext first.');
    }
    this.context.stage = stage;
  }

  /**
   * Mark an agent as completed
   * ORCHESTRATOR ONLY
   */
  markAgentComplete(role: AgentRole): void {
    if (!this.context) {
      throw new Error('Context not initialized. Call initializeContext first.');
    }
    if (!this.context.metadata.completedAgents.includes(role)) {
      this.context.metadata.completedAgents.push(role);
    }
  }

  /**
   * Get the full context (orchestrator only)
   */
  getFullContext(): TeamContext | null {
    return this.context;
  }

  /**
   * Clear the current context
   * ORCHESTRATOR ONLY
   */
  clearContext(): void {
    this.context = null;
  }
}

/**
 * Singleton instance (will be used by orchestrator in Phase 3)
 */
export const teamContextManager = new TeamContextManager();

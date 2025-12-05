/**
 * CollaborationEngine - Real-Time Team Collaboration System
 *
 * PHASE 3 - IMPLEMENTATION
 *
 * Purpose: Enables agents to comment on each other's work via orchestrator
 * Scope: Full implementation for cross-agent feedback
 * Status: Complete
 *
 * Architecture Rules:
 * - Agents can post feedback but cannot modify each other's outputs
 * - All communication routed through orchestrator
 * - Read-only observation enforced
 * - Moderation prevents infinite loops
 */

import { AgentRole, AgentOutput } from '../models/agentTypes';
import {
  DiscussionThreadManager,
  MessageType,
  MessageSeverity,
  DiscussionMessage,
  DiscussionThread,
  ThreadStatus,
} from './DiscussionThread';
import { TeamContextManager, WorkflowStage } from './TeamContextManager';
import { CollaborationHelpers } from './CollaborationHelpers';

/**
 * Feedback request from one agent to another
 */
export interface FeedbackRequest {
  /** Requesting agent */
  from: AgentRole;

  /** Target agent */
  to: AgentRole;

  /** Type of feedback requested */
  type: MessageType;

  /** Content of the request */
  content: string;

  /** Reference to code or output */
  reference?: string;

  /** Severity (for concerns) */
  severity?: MessageSeverity;
}

/**
 * Feedback response
 */
export interface FeedbackResponse {
  /** Message ID of the response */
  messageId: string;

  /** Agent who responded */
  from: AgentRole;

  /** Original request author */
  to: AgentRole;

  /** Response content */
  content: string;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Collaboration session configuration
 */
export interface CollaborationConfig {
  /** Maximum feedback rounds before escalation */
  maxFeedbackRounds: number;

  /** Maximum messages per thread */
  maxMessagesPerThread: number;

  /** Enable automatic moderation */
  enableModeration: boolean;
}

/**
 * CollaborationEngine - Manages cross-agent collaboration
 *
 * Responsibilities:
 * - Route feedback between agents via orchestrator
 * - Maintain discussion threads
 * - Enforce read-only rules
 * - Prevent infinite loops via moderation
 */
export class CollaborationEngine {
  private threadManager: DiscussionThreadManager;
  private contextManager: TeamContextManager;
  private config: CollaborationConfig;
  private feedbackRounds: Map<string, number> = new Map();

  constructor(
    threadManager: DiscussionThreadManager,
    contextManager: TeamContextManager,
    config?: Partial<CollaborationConfig>
  ) {
    this.threadManager = threadManager;
    this.contextManager = contextManager;
    this.config = {
      maxFeedbackRounds: config?.maxFeedbackRounds ?? 3,
      maxMessagesPerThread: config?.maxMessagesPerThread ?? 20,
      enableModeration: config?.enableModeration ?? true,
    };
  }

  /**
   * Submit feedback from one agent to another
   * ORCHESTRATOR ONLY - called on behalf of agent
   */
  submitFeedback(request: FeedbackRequest): DiscussionMessage {
    // Get or create thread for this agent pair
    const threadId = CollaborationHelpers.getOrCreateThread(
      this.threadManager,
      request.from,
      request.to
    );

    // Check moderation limits
    if (this.config.enableModeration) {
      CollaborationHelpers.checkModerationLimits(
        this.threadManager,
        threadId,
        this.config,
        this.feedbackRounds
      );
    }

    // Post message to thread
    const message = this.threadManager.postMessage(
      threadId,
      request.from,
      request.type,
      request.content,
      {
        targetAgent: request.to,
        severity: request.severity,
        codeRef: request.reference,
      }
    );

    // Increment feedback round counter
    CollaborationHelpers.incrementFeedbackRound(this.feedbackRounds, threadId);

    return message;
  }

  /**
   * Respond to feedback
   * ORCHESTRATOR ONLY - called on behalf of agent
   */
  respondToFeedback(
    threadId: string,
    originalMessageId: string,
    respondingAgent: AgentRole,
    response: string
  ): FeedbackResponse {
    // Post response as a message
    const message = this.threadManager.postMessage(
      threadId,
      respondingAgent,
      MessageType.RESPONSE,
      response,
      {
        replyTo: originalMessageId,
      }
    );

    return {
      messageId: message.id,
      from: respondingAgent,
      to: message.targetAgent || 'leadArchitect',
      content: response,
      timestamp: message.timestamp,
    };
  }

  /**
   * Get all feedback for a specific agent
   * Agents can call this (read-only)
   */
  getFeedbackForAgent(agent: AgentRole): DiscussionMessage[] {
    const threads = this.threadManager.getThreadsForAgent(agent);
    const feedback: DiscussionMessage[] = [];

    for (const threadSummary of threads) {
      const thread = this.threadManager.getThread(threadSummary.threadId);
      if (thread) {
        const agentMessages = thread.messages.filter(
          (msg) => msg.targetAgent === agent || msg.author === agent
        );
        feedback.push(...agentMessages);
      }
    }

    return feedback;
  }

  /**
   * Get all unresolved concerns across the team
   */
  getUnresolvedConcerns(): DiscussionMessage[] {
    return this.threadManager.getUnresolvedConcerns();
  }

  /**
   * Check if collaboration has reached moderation limits
   */
  shouldEscalate(): boolean {
    const concerns = this.getUnresolvedConcerns();

    // Escalate if too many unresolved concerns
    if (concerns.length > 5) {
      return true;
    }

    // Escalate if any thread has exceeded feedback rounds
    for (const [threadId, rounds] of this.feedbackRounds.entries()) {
      if (rounds >= this.config.maxFeedbackRounds) {
        return true;
      }
    }

    return false;
  }

  /**
   * Close all collaboration threads
   * ORCHESTRATOR ONLY - called after decision
   */
  closeCollaboration(status: ThreadStatus = ThreadStatus.CLOSED): void {
    const activeThreads = this.threadManager.getActiveThreads();

    for (const thread of activeThreads) {
      this.threadManager.closeThread(thread.threadId, status);
    }

    this.feedbackRounds.clear();
  }

  /**
   * Reset collaboration state
   * ORCHESTRATOR ONLY
   */
  reset(): void {
    this.threadManager.clearThreads();
    this.feedbackRounds.clear();
  }

}

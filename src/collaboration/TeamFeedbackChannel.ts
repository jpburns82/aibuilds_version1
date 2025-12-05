/**
 * TeamFeedbackChannel - Message Passing System for Agent Feedback
 *
 * PHASE 3 - IMPLEMENTATION
 *
 * Purpose: Queue and route feedback messages between agents
 * Scope: Full implementation for asynchronous communication
 * Status: Complete
 *
 * Architecture Rules:
 * - Queues messages for delivery to agents
 * - Logs all cross-agent communication
 * - Enforces moderation rules
 * - Provides message routing and filtering
 */

import { AgentRole } from '../models/agentTypes';
import { MessageType, MessageSeverity } from './DiscussionThread';

/**
 * A feedback message in the channel
 */
export interface FeedbackMessage {
  /** Unique message ID */
  id: string;

  /** Sender agent */
  from: AgentRole;

  /** Recipient agent */
  to: AgentRole;

  /** Message type */
  type: MessageType;

  /** Message content */
  content: string;

  /** Severity level */
  severity?: MessageSeverity;

  /** Timestamp */
  timestamp: Date;

  /** Whether message has been delivered/read */
  delivered: boolean;

  /** Optional metadata */
  metadata?: {
    /** Reference to code or file */
    codeRef?: string;

    /** Tags for categorization */
    tags?: string[];

    /** Reply to message ID */
    replyTo?: string;
  };
}

/**
 * Message queue statistics
 */
export interface QueueStats {
  /** Total messages sent */
  totalSent: number;

  /** Total messages delivered */
  totalDelivered: number;

  /** Pending messages */
  pending: number;

  /** Messages by agent */
  messagesByAgent: Map<AgentRole, number>;
}

/**
 * TeamFeedbackChannel - Manages feedback message queue and routing
 *
 * Responsibilities:
 * - Queue feedback messages for agents
 * - Route messages to appropriate recipients
 * - Log all communication
 * - Provide message filtering and retrieval
 */
export class TeamFeedbackChannel {
  private messageQueue: FeedbackMessage[] = [];
  private messageLog: FeedbackMessage[] = [];
  private messageCounter = 0;

  /**
   * Send a feedback message to an agent
   * ORCHESTRATOR ONLY - queues message for delivery
   */
  sendMessage(
    from: AgentRole,
    to: AgentRole,
    type: MessageType,
    content: string,
    options?: {
      severity?: MessageSeverity;
      codeRef?: string;
      tags?: string[];
      replyTo?: string;
    }
  ): FeedbackMessage {
    const messageId = `feedback-${Date.now()}-${this.messageCounter++}`;

    const message: FeedbackMessage = {
      id: messageId,
      from,
      to,
      type,
      content,
      severity: options?.severity,
      timestamp: new Date(),
      delivered: false,
      metadata: {
        codeRef: options?.codeRef,
        tags: options?.tags,
        replyTo: options?.replyTo,
      },
    };

    this.messageQueue.push(message);
    this.messageLog.push(message);

    return message;
  }

  /**
   * Get all pending messages for a specific agent
   * Marks messages as delivered
   */
  getMessagesForAgent(agent: AgentRole): FeedbackMessage[] {
    const messages = this.messageQueue.filter((msg) => msg.to === agent);

    // Mark as delivered
    messages.forEach((msg) => {
      msg.delivered = true;
    });

    // Remove from queue
    this.messageQueue = this.messageQueue.filter((msg) => msg.to !== agent);

    return messages;
  }

  /**
   * Peek at messages for an agent without marking as delivered
   * READ-ONLY
   */
  peekMessagesForAgent(agent: AgentRole): Readonly<FeedbackMessage>[] {
    return this.messageQueue.filter(
      (msg) => msg.to === agent
    ) as Readonly<FeedbackMessage>[];
  }

  /**
   * Get all messages sent by a specific agent
   * READ-ONLY
   */
  getMessagesSentByAgent(agent: AgentRole): Readonly<FeedbackMessage>[] {
    return this.messageLog.filter(
      (msg) => msg.from === agent
    ) as Readonly<FeedbackMessage>[];
  }

  /**
   * Get conversation history between two agents
   * READ-ONLY
   */
  getConversation(
    agent1: AgentRole,
    agent2: AgentRole
  ): Readonly<FeedbackMessage>[] {
    return this.messageLog.filter(
      (msg) =>
        (msg.from === agent1 && msg.to === agent2) ||
        (msg.from === agent2 && msg.to === agent1)
    ) as Readonly<FeedbackMessage>[];
  }

  /**
   * Get all messages of a specific type
   * READ-ONLY
   */
  getMessagesByType(type: MessageType): Readonly<FeedbackMessage>[] {
    return this.messageLog.filter(
      (msg) => msg.type === type
    ) as Readonly<FeedbackMessage>[];
  }

  /**
   * Get all messages with specific severity
   * READ-ONLY
   */
  getMessagesBySeverity(
    severity: MessageSeverity
  ): Readonly<FeedbackMessage>[] {
    return this.messageLog.filter(
      (msg) => msg.severity === severity
    ) as Readonly<FeedbackMessage>[];
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const messagesByAgent = new Map<AgentRole, number>();

    for (const msg of this.messageLog) {
      const count = messagesByAgent.get(msg.from) || 0;
      messagesByAgent.set(msg.from, count + 1);
    }

    return {
      totalSent: this.messageLog.length,
      totalDelivered: this.messageLog.filter((msg) => msg.delivered).length,
      pending: this.messageQueue.length,
      messagesByAgent,
    };
  }

  /**
   * Check if there are pending messages for an agent
   */
  hasPendingMessages(agent: AgentRole): boolean {
    return this.messageQueue.some((msg) => msg.to === agent);
  }

  /**
   * Get count of pending messages for an agent
   */
  getPendingCount(agent: AgentRole): number {
    return this.messageQueue.filter((msg) => msg.to === agent).length;
  }

  /**
   * Clear all messages (orchestrator only)
   */
  clearAll(): void {
    this.messageQueue = [];
    this.messageLog = [];
    this.messageCounter = 0;
  }

  /**
   * Clear only the queue, keeping the log
   */
  clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Get all logged messages
   * READ-ONLY
   */
  getFullLog(): Readonly<FeedbackMessage>[] {
    return this.messageLog as Readonly<FeedbackMessage>[];
  }

  /**
   * Export communication log for audit
   */
  exportLog(): {
    timestamp: Date;
    totalMessages: number;
    messages: FeedbackMessage[];
  } {
    return {
      timestamp: new Date(),
      totalMessages: this.messageLog.length,
      messages: [...this.messageLog],
    };
  }
}

/**
 * Singleton instance for team feedback channel
 */
export const teamFeedbackChannel = new TeamFeedbackChannel();

/**
 * DiscussionThreadTypes - Type Definitions for Discussion Threads
 *
 * PHASE 3 - TYPE MODULE
 *
 * Purpose: Extract type definitions from DiscussionThread to maintain <300 line limit
 */

import { AgentRole } from '../models/agentTypes';

/**
 * Types of messages agents can post
 */
export enum MessageType {
  /** General observation or comment */
  OBSERVATION = 'observation',

  /** Question directed at another agent */
  QUESTION = 'question',

  /** Suggestion for improvement */
  SUGGESTION = 'suggestion',

  /** Flag a potential issue */
  CONCERN = 'concern',

  /** Approval/agreement with previous work */
  APPROVAL = 'approval',

  /** Response to a question */
  RESPONSE = 'response',
}

/**
 * Severity level for concerns/issues
 */
export enum MessageSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Thread status
 */
export enum ThreadStatus {
  /** Thread is active, accepting messages */
  ACTIVE = 'active',

  /** Waiting for response from specific agent */
  AWAITING_RESPONSE = 'awaiting_response',

  /** Issue resolved, thread can be closed */
  RESOLVED = 'resolved',

  /** Thread closed, no more messages */
  CLOSED = 'closed',

  /** Escalated to LeadArchitect or human */
  ESCALATED = 'escalated',
}

/**
 * Individual message in a discussion thread
 */
export interface DiscussionMessage {
  /** Unique message identifier */
  id: string;

  /** Agent who posted this message */
  author: AgentRole;

  /** Type of message */
  type: MessageType;

  /** Message content */
  content: string;

  /** Severity (for concerns/issues) */
  severity?: MessageSeverity;

  /** Reference to another message (for replies) */
  replyTo?: string;

  /** Targeted agent (for questions) */
  targetAgent?: AgentRole;

  /** Timestamp */
  timestamp: Date;

  /** Metadata */
  metadata?: {
    /** Code reference (file:line) */
    codeRef?: string;

    /** Tags for categorization */
    tags?: string[];
  };
}

/**
 * A discussion thread between agents
 */
export interface DiscussionThread {
  /** Unique thread identifier */
  threadId: string;

  /** Thread topic */
  topic: string;

  /** All messages in this thread */
  messages: DiscussionMessage[];

  /** Participating agents */
  participants: AgentRole[];

  /** Thread status */
  status: ThreadStatus;

  /** When thread was created */
  createdAt: Date;

  /** When thread was last updated */
  updatedAt: Date;

  /** Whether thread is locked (no more messages) */
  locked: boolean;
}

/**
 * Summary of a discussion thread
 */
export interface ThreadSummary {
  threadId: string;
  topic: string;
  messageCount: number;
  participants: AgentRole[];
  status: ThreadStatus;
  lastActivity: Date;
  unresolvedConcerns: number;
}

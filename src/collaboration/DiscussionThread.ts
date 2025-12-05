/**
 * DiscussionThread - Abstraction for Shared Team Updates
 *
 * PHASE 3 - IMPLEMENTATION COMPLETE
 *
 * Purpose: Manages cross-agent communication via threaded discussions
 * Scope: Full implementation for team collaboration
 * Status: Complete
 *
 * Architecture Rule: Agents can post messages but cannot modify others' messages
 */

import { AgentRole } from '../models/agentTypes';
import { ThreadHelpers } from './ThreadHelpers';
import {
  MessageType,
  MessageSeverity,
  ThreadStatus,
  DiscussionMessage,
  DiscussionThread,
  ThreadSummary,
} from './DiscussionThreadTypes';

// Re-export types for external consumers
export {
  MessageType,
  MessageSeverity,
  ThreadStatus,
  DiscussionMessage,
  DiscussionThread,
  ThreadSummary,
};

/**
 * DiscussionThreadManager - Manages discussion threads
 *
 * IMPLEMENTATION (Phase 3):
 * - Orchestrator creates and manages threads
 * - Agents can post messages (orchestrator mediates)
 * - Agents can read all messages (read-only)
 * - Cannot edit or delete messages (audit trail)
 * - Thread locking prevents infinite loops
 */
export class DiscussionThreadManager {
  private threads: Map<string, DiscussionThread> = new Map();
  private messageCounter = 0;
  private threadCounter = 0;

  /**
   * Create a new discussion thread
   * ORCHESTRATOR ONLY
   */
  createThread(topic: string, participants: AgentRole[]): DiscussionThread {
    const threadId = `thread-${Date.now()}-${this.threadCounter++}`;
    const now = new Date();

    const thread: DiscussionThread = {
      threadId,
      topic,
      messages: [],
      participants,
      status: ThreadStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      locked: false,
    };

    this.threads.set(threadId, thread);
    return thread;
  }

  /**
   * Post a message to a thread
   * Called by orchestrator on behalf of agent
   */
  postMessage(
    threadId: string,
    author: AgentRole,
    type: MessageType,
    content: string,
    options?: {
      severity?: MessageSeverity;
      replyTo?: string;
      targetAgent?: AgentRole;
      codeRef?: string;
      tags?: string[];
    }
  ): DiscussionMessage {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (thread.locked) {
      throw new Error(`Thread ${threadId} is locked - no more messages allowed`);
    }

    const messageId = `msg-${Date.now()}-${this.messageCounter++}`;
    const message: DiscussionMessage = {
      id: messageId,
      author,
      type,
      content,
      timestamp: new Date(),
      severity: options?.severity,
      replyTo: options?.replyTo,
      targetAgent: options?.targetAgent,
      metadata: {
        codeRef: options?.codeRef,
        tags: options?.tags,
      },
    };

    thread.messages.push(message);
    thread.updatedAt = new Date();

    // Add participant if not already included
    if (!thread.participants.includes(author)) {
      thread.participants.push(author);
    }

    return message;
  }

  /**
   * Get all messages in a thread
   * Agents can call this (read-only)
   */
  getThread(threadId: string): Readonly<DiscussionThread> | null {
    const thread = this.threads.get(threadId);
    return thread ? (thread as Readonly<DiscussionThread>) : null;
  }

  /**
   * Get all active threads
   */
  getActiveThreads(): ThreadSummary[] {
    const summaries: ThreadSummary[] = [];

    for (const thread of this.threads.values()) {
      if (thread.status === ThreadStatus.ACTIVE || thread.status === ThreadStatus.AWAITING_RESPONSE) {
        summaries.push(ThreadHelpers.createThreadSummary(thread));
      }
    }

    return summaries;
  }

  /**
   * Get threads involving a specific agent
   */
  getThreadsForAgent(agent: AgentRole): ThreadSummary[] {
    const summaries: ThreadSummary[] = [];

    for (const thread of this.threads.values()) {
      if (thread.participants.includes(agent)) {
        summaries.push(ThreadHelpers.createThreadSummary(thread));
      }
    }

    return summaries;
  }

  /**
   * Close a thread (no more messages allowed)
   * ORCHESTRATOR ONLY
   */
  closeThread(threadId: string, status: ThreadStatus): void {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.status = status;
    thread.locked = true;
    thread.updatedAt = new Date();
  }

  /**
   * Get all unresolved concerns across all threads
   */
  getUnresolvedConcerns(): DiscussionMessage[] {
    const concerns: DiscussionMessage[] = [];

    for (const thread of this.threads.values()) {
      if (thread.status !== ThreadStatus.RESOLVED && thread.status !== ThreadStatus.CLOSED) {
        const threadConcerns = thread.messages.filter(
          (msg) => msg.type === MessageType.CONCERN
        );
        concerns.push(...threadConcerns);
      }
    }

    return concerns;
  }

  /**
   * Clear all threads (orchestrator only)
   */
  clearThreads(): void {
    this.threads.clear();
  }
}

/**
 * Singleton instance (will be used in Phase 3)
 */
export const discussionThreadManager = new DiscussionThreadManager();

/**
 * CollaborationHelpers - Helper Functions for CollaborationEngine
 *
 * PHASE 3 - HELPER MODULE
 *
 * Purpose: Extract helper logic from CollaborationEngine to maintain <300 line limit
 */

import { AgentRole } from '../models/agentTypes';
import {
  DiscussionThreadManager,
  ThreadStatus,
  ThreadSummary,
} from './DiscussionThread';
import { CollaborationConfig } from './CollaborationEngine';

/**
 * Helper functions for collaboration engine
 */
export class CollaborationHelpers {
  /**
   * Get or create a thread for agent-to-agent communication
   */
  static getOrCreateThread(
    threadManager: DiscussionThreadManager,
    from: AgentRole,
    to: AgentRole
  ): string {
    const topic = `${from} → ${to}`;
    const activeThreads = threadManager.getActiveThreads();

    // Find existing thread
    const existingThread = activeThreads.find((t) => t.topic === topic);
    if (existingThread) {
      return existingThread.threadId;
    }

    // Create new thread
    const thread = threadManager.createThread(topic, [from, to]);
    return thread.threadId;
  }

  /**
   * Check if thread has exceeded moderation limits
   */
  static checkModerationLimits(
    threadManager: DiscussionThreadManager,
    threadId: string,
    config: CollaborationConfig,
    feedbackRounds: Map<string, number>
  ): void {
    const thread = threadManager.getThread(threadId);
    if (!thread) {
      return;
    }

    // Check message count limit
    if (thread.messages.length >= config.maxMessagesPerThread) {
      threadManager.closeThread(threadId, ThreadStatus.ESCALATED);
      throw new Error(
        `Thread ${threadId} exceeded message limit. Escalating to LeadArchitect.`
      );
    }

    // Check feedback round limit
    const rounds = feedbackRounds.get(threadId) || 0;
    if (rounds >= config.maxFeedbackRounds) {
      threadManager.closeThread(threadId, ThreadStatus.ESCALATED);
      throw new Error(
        `Thread ${threadId} exceeded feedback round limit. Escalating to LeadArchitect.`
      );
    }
  }

  /**
   * Increment feedback round counter for a thread
   */
  static incrementFeedbackRound(
    feedbackRounds: Map<string, number>,
    threadId: string
  ): void {
    const current = feedbackRounds.get(threadId) || 0;
    feedbackRounds.set(threadId, current + 1);
  }
}

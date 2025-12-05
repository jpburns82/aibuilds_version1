/**
 * ThreadHelpers - Helper functions for discussion threads
 *
 * PHASE 3 - HELPER MODULE
 *
 * Purpose: Extract helper logic from DiscussionThread to maintain <300 line limit
 */

import { DiscussionThread, ThreadSummary, MessageType } from './DiscussionThread';

/**
 * Thread helper functions
 */
export class ThreadHelpers {
  /**
   * Create a summary from a discussion thread
   */
  static createThreadSummary(thread: DiscussionThread): ThreadSummary {
    const unresolvedConcerns = thread.messages.filter(
      (msg) => msg.type === MessageType.CONCERN
    ).length;

    return {
      threadId: thread.threadId,
      topic: thread.topic,
      messageCount: thread.messages.length,
      participants: thread.participants,
      status: thread.status,
      lastActivity: thread.updatedAt,
      unresolvedConcerns,
    };
  }
}

/**
 * ModerationDetectors - Pattern Detection for Agent Moderation
 *
 * PHASE 3 - HELPER MODULE
 *
 * Purpose: Detect circular discussions, repetitive feedback, and other patterns
 * Separated from AgentModerator to maintain <300 line limit
 */

import { AgentRole } from '../models/agentTypes';
import { DiscussionThread, MessageType } from './DiscussionThread';
import { ModerationViolation } from './AgentModerator';

/**
 * Detectors for moderation violations
 */
export class ModerationDetectors {
  /**
   * Detect circular discussion patterns (A→B→A→B→A→B)
   */
  static detectCircularDiscussion(
    thread: DiscussionThread
  ): ModerationViolation | null {
    if (thread.messages.length < 6) {
      return null; // Need at least 6 messages to detect pattern
    }

    // Check for A→B→A→B→A→B pattern
    const recentMessages = thread.messages.slice(-6);
    const authors = recentMessages.map((msg) => msg.author);

    // Check if pattern alternates between two agents
    const uniqueAuthors = [...new Set(authors)];
    if (uniqueAuthors.length === 2) {
      let isAlternating = true;
      for (let i = 0; i < authors.length - 1; i++) {
        if (authors[i] === authors[i + 1]) {
          isAlternating = false;
          break;
        }
      }

      if (isAlternating) {
        return {
          type: 'CIRCULAR_DISCUSSION',
          severity: 'CRITICAL',
          description: `Detected circular discussion between ${uniqueAuthors[0]} and ${uniqueAuthors[1]}`,
          agents: uniqueAuthors,
          action: 'ESCALATE',
          timestamp: new Date(),
        };
      }
    }

    return null;
  }

  /**
   * Detect repetitive feedback from same agent
   */
  static detectRepetitiveFeedback(
    thread: DiscussionThread
  ): ModerationViolation | null {
    if (thread.messages.length < 4) {
      return null;
    }

    // Check for similar content in recent messages
    const recentMessages = thread.messages.slice(-4);

    for (let i = 0; i < recentMessages.length - 1; i++) {
      for (let j = i + 1; j < recentMessages.length; j++) {
        const msg1 = recentMessages[i];
        const msg2 = recentMessages[j];

        // Check if same author repeating similar message
        if (
          msg1.author === msg2.author &&
          this.isSimilarContent(msg1.content, msg2.content)
        ) {
          return {
            type: 'REPETITIVE_FEEDBACK',
            severity: 'WARNING',
            description: `${msg1.author} is repeating similar feedback`,
            agents: [msg1.author],
            action: 'WARN',
            timestamp: new Date(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if two message contents are similar
   * @private
   */
  private static isSimilarContent(
    content1: string,
    content2: string
  ): boolean {
    // Simple similarity check: normalize and compare
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const norm1 = normalize(content1);
    const norm2 = normalize(content2);

    // Check if one is substring of other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return true;
    }

    return false;
  }
}

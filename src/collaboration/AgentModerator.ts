/**
 * AgentModerator - Prevents Infinite Agent-to-Agent Loops
 *
 * PHASE 3 - IMPLEMENTATION
 *
 * Purpose: Moderate agent collaboration to prevent infinite feedback loops
 * Scope: Full implementation for collaboration safety
 * Status: Complete
 *
 * Architecture Rules:
 * - Limits number of feedback rounds
 * - Detects circular discussions
 * - Forces escalation when limits exceeded
 * - Prevents agent conflicts
 */

import { AgentRole } from '../models/agentTypes';
import { DiscussionThread, MessageType, ThreadStatus } from './DiscussionThread';
import { FeedbackMessage } from './TeamFeedbackChannel';
import { ModerationDetectors } from './ModerationDetectors';

/**
 * Moderation rule violation
 */
export interface ModerationViolation {
  /** Type of violation */
  type:
    | 'EXCESSIVE_ROUNDS'
    | 'CIRCULAR_DISCUSSION'
    | 'MESSAGE_LIMIT_EXCEEDED'
    | 'REPETITIVE_FEEDBACK'
    | 'AGENT_CONFLICT';

  /** Severity of violation */
  severity: 'WARNING' | 'CRITICAL';

  /** Description */
  description: string;

  /** Involved agents */
  agents: AgentRole[];

  /** Recommended action */
  action: 'WARN' | 'ESCALATE' | 'TERMINATE';

  /** Timestamp */
  timestamp: Date;
}

/**
 * Moderation configuration
 */
export interface ModerationConfig {
  /** Maximum feedback rounds between any two agents */
  maxFeedbackRounds: number;

  /** Maximum total messages in a thread */
  maxMessagesPerThread: number;

  /** Maximum concerns before escalation */
  maxConcerns: number;

  /** Enable circular discussion detection */
  detectCircular: boolean;

  /** Enable repetitive feedback detection */
  detectRepetitive: boolean;
}

/**
 * Moderation statistics
 */
export interface ModerationStats {
  /** Total violations detected */
  totalViolations: number;

  /** Violations by type */
  violationsByType: Map<string, number>;

  /** Escalations triggered */
  escalations: number;

  /** Warnings issued */
  warnings: number;
}

/**
 * AgentModerator - Moderates agent collaboration
 *
 * Responsibilities:
 * - Monitor feedback rounds
 * - Detect circular discussions
 * - Enforce message limits
 * - Trigger escalations
 * - Prevent conflicts
 */
export class AgentModerator {
  private config: ModerationConfig;
  private violations: ModerationViolation[] = [];
  private feedbackRounds: Map<string, number> = new Map();

  constructor(config?: Partial<ModerationConfig>) {
    this.config = {
      maxFeedbackRounds: config?.maxFeedbackRounds ?? 3,
      maxMessagesPerThread: config?.maxMessagesPerThread ?? 20,
      maxConcerns: config?.maxConcerns ?? 5,
      detectCircular: config?.detectCircular ?? true,
      detectRepetitive: config?.detectRepetitive ?? true,
    };
  }

  /**
   * Check if a thread should be moderated
   * Returns violations if any detected
   */
  moderateThread(thread: DiscussionThread): ModerationViolation[] {
    const violations: ModerationViolation[] = [];

    // Check message count
    if (thread.messages.length >= this.config.maxMessagesPerThread) {
      violations.push({
        type: 'MESSAGE_LIMIT_EXCEEDED',
        severity: 'CRITICAL',
        description: `Thread has ${thread.messages.length} messages (limit: ${this.config.maxMessagesPerThread})`,
        agents: thread.participants,
        action: 'ESCALATE',
        timestamp: new Date(),
      });
    }

    // Check concern count
    const concerns = thread.messages.filter(
      (msg) => msg.type === MessageType.CONCERN
    );
    if (concerns.length >= this.config.maxConcerns) {
      violations.push({
        type: 'EXCESSIVE_ROUNDS',
        severity: 'CRITICAL',
        description: `Thread has ${concerns.length} unresolved concerns (limit: ${this.config.maxConcerns})`,
        agents: thread.participants,
        action: 'ESCALATE',
        timestamp: new Date(),
      });
    }

    // Check for circular discussions
    if (this.config.detectCircular) {
      const circularViolation = ModerationDetectors.detectCircularDiscussion(
        thread
      );
      if (circularViolation) {
        violations.push(circularViolation);
      }
    }

    // Check for repetitive feedback
    if (this.config.detectRepetitive) {
      const repetitiveViolation = ModerationDetectors.detectRepetitiveFeedback(
        thread
      );
      if (repetitiveViolation) {
        violations.push(repetitiveViolation);
      }
    }

    // Log violations
    violations.forEach((v) => this.violations.push(v));

    return violations;
  }

  /**
   * Check if feedback rounds between two agents should be limited
   */
  checkFeedbackRounds(
    agent1: AgentRole,
    agent2: AgentRole
  ): ModerationViolation | null {
    const key = this.getAgentPairKey(agent1, agent2);
    const rounds = this.feedbackRounds.get(key) || 0;

    if (rounds >= this.config.maxFeedbackRounds) {
      const violation: ModerationViolation = {
        type: 'EXCESSIVE_ROUNDS',
        severity: 'CRITICAL',
        description: `Feedback rounds between ${agent1} and ${agent2} exceeded limit (${rounds}/${this.config.maxFeedbackRounds})`,
        agents: [agent1, agent2],
        action: 'ESCALATE',
        timestamp: new Date(),
      };

      this.violations.push(violation);
      return violation;
    }

    return null;
  }

  /**
   * Increment feedback round count between two agents
   */
  incrementFeedbackRound(agent1: AgentRole, agent2: AgentRole): void {
    const key = this.getAgentPairKey(agent1, agent2);
    const current = this.feedbackRounds.get(key) || 0;
    this.feedbackRounds.set(key, current + 1);
  }

  /**
   * Check if moderation should trigger escalation
   */
  shouldEscalate(): boolean {
    const criticalViolations = this.violations.filter(
      (v) => v.severity === 'CRITICAL' && v.action === 'ESCALATE'
    );

    return criticalViolations.length > 0;
  }

  /**
   * Get all violations
   */
  getViolations(): ModerationViolation[] {
    return [...this.violations];
  }

  /**
   * Get critical violations only
   */
  getCriticalViolations(): ModerationViolation[] {
    return this.violations.filter((v) => v.severity === 'CRITICAL');
  }

  /**
   * Get moderation statistics
   */
  getStats(): ModerationStats {
    const violationsByType = new Map<string, number>();

    for (const violation of this.violations) {
      const count = violationsByType.get(violation.type) || 0;
      violationsByType.set(violation.type, count + 1);
    }

    return {
      totalViolations: this.violations.length,
      violationsByType,
      escalations: this.violations.filter((v) => v.action === 'ESCALATE')
        .length,
      warnings: this.violations.filter((v) => v.action === 'WARN').length,
    };
  }

  /**
   * Reset moderation state
   */
  reset(): void {
    this.violations = [];
    this.feedbackRounds.clear();
  }

  /**
   * Get unique key for agent pair
   * @private
   */
  private getAgentPairKey(agent1: AgentRole, agent2: AgentRole): string {
    // Always sort to ensure same key regardless of order
    const sorted = [agent1, agent2].sort();
    return `${sorted[0]}-${sorted[1]}`;
  }
}

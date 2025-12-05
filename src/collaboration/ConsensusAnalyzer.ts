/**
 * ConsensusAnalyzer - Analysis Logic for Consensus Reporting
 *
 * PHASE 3 - HELPER MODULE
 *
 * Purpose: Extract analysis logic from ConsensusReporter to maintain <300 line limit
 */

import { AgentRole } from '../models/agentTypes';
import {
  DiscussionMessage,
  MessageType,
  MessageSeverity,
} from './DiscussionThread';
import {
  ConsensusLevel,
  AgentOpinion,
  TopicConsensus,
} from './ConsensusReporter';
import { ConsensusReportFormatter } from './ConsensusReportFormatter';

/**
 * Analysis functions for consensus reporting
 */
export class ConsensusAnalyzer {
  /**
   * Extract opinions from discussion messages
   */
  static extractOpinions(messages: DiscussionMessage[]): AgentOpinion[] {
    const opinions: AgentOpinion[] = [];

    for (const msg of messages) {
      let stance: 'APPROVE' | 'CONCERN' | 'REJECT' | 'NEUTRAL' = 'NEUTRAL';

      switch (msg.type) {
        case MessageType.APPROVAL:
          stance = 'APPROVE';
          break;
        case MessageType.CONCERN:
          stance = 'CONCERN';
          break;
        case MessageType.SUGGESTION:
          stance = 'CONCERN';
          break;
        default:
          stance = 'NEUTRAL';
      }

      opinions.push({
        agent: msg.author,
        stance,
        reasoning: msg.content,
        severity: msg.severity,
      });
    }

    return opinions;
  }

  /**
   * Group opinions by topic
   */
  static groupByTopic(
    opinions: AgentOpinion[],
    messages: DiscussionMessage[],
    quickConsensusCheck: (
      approvals: number,
      concerns: number,
      rejections: number,
      total: number
    ) => ConsensusLevel
  ): TopicConsensus[] {
    // For simplicity, create one main topic
    const mainTopic = 'Implementation Review';

    const agreeCount = opinions.filter((o) => o.stance === 'APPROVE').length;
    const concernCount = opinions.filter((o) => o.stance === 'CONCERN').length;
    const rejectCount = opinions.filter((o) => o.stance === 'REJECT').length;

    const total = opinions.length;
    const level = quickConsensusCheck(
      agreeCount,
      concernCount,
      rejectCount,
      total
    );

    return [
      {
        topic: mainTopic,
        level,
        agreeCount,
        concernCount,
        rejectCount,
        opinions,
        summary: ConsensusReportFormatter.summarizeTopicConsensus(
          level,
          agreeCount,
          concernCount,
          rejectCount
        ),
      },
    ];
  }

  /**
   * Extract unresolved concerns from messages
   */
  static extractUnresolvedConcerns(
    messages: DiscussionMessage[]
  ): DiscussionMessage[] {
    return messages.filter((msg) => msg.type === MessageType.CONCERN);
  }

  /**
   * Identify conflicts from topics
   */
  static identifyConflicts(topics: TopicConsensus[]): string[] {
    const conflicts: string[] = [];

    for (const topic of topics) {
      if (topic.level === ConsensusLevel.CONFLICT) {
        conflicts.push(`${topic.topic}: Conflicting opinions detected`);
      }

      if (topic.rejectCount > 0) {
        conflicts.push(`${topic.topic}: ${topic.rejectCount} rejections`);
      }
    }

    return conflicts;
  }

  /**
   * Calculate overall consensus from topics
   */
  static calculateOverallConsensus(
    topics: TopicConsensus[]
  ): ConsensusLevel {
    if (topics.length === 0) {
      return ConsensusLevel.WEAK;
    }

    const levels = topics.map((t) => t.level);

    if (levels.includes(ConsensusLevel.CONFLICT)) {
      return ConsensusLevel.CONFLICT;
    }

    if (levels.every((l) => l === ConsensusLevel.UNANIMOUS)) {
      return ConsensusLevel.UNANIMOUS;
    }

    if (
      levels.every(
        (l) => l === ConsensusLevel.STRONG || l === ConsensusLevel.UNANIMOUS
      )
    ) {
      return ConsensusLevel.STRONG;
    }

    if (levels.some((l) => l === ConsensusLevel.WEAK)) {
      return ConsensusLevel.WEAK;
    }

    return ConsensusLevel.MODERATE;
  }

  /**
   * Determine recommendation based on consensus and concerns
   */
  static determineRecommendation(
    consensus: ConsensusLevel,
    concerns: DiscussionMessage[],
    conflicts: string[]
  ): 'APPROVE' | 'REVISE' | 'ESCALATE' | 'REJECT' {
    if (conflicts.length > 0) {
      return 'ESCALATE';
    }

    if (consensus === ConsensusLevel.CONFLICT) {
      return 'ESCALATE';
    }

    if (concerns.length > 5) {
      return 'REVISE';
    }

    if (
      consensus === ConsensusLevel.UNANIMOUS ||
      consensus === ConsensusLevel.STRONG
    ) {
      return 'APPROVE';
    }

    if (consensus === ConsensusLevel.MODERATE) {
      return concerns.length > 0 ? 'REVISE' : 'APPROVE';
    }

    return 'REVISE';
  }
}

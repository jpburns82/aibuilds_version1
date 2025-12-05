/**
 * ConsensusReporter - Generate Team Agreement Reports
 *
 * PHASE 3 - IMPLEMENTATION
 *
 * Purpose: Collect feedback and identify consensus/conflicts before final decision
 * Scope: Full implementation for consensus tracking
 * Status: Complete
 *
 * Architecture Rules:
 * - Collects feedback from all agents
 * - Identifies areas of agreement and disagreement
 * - Escalates conflicts to LeadArchitect
 * - Produces "Agent Consensus Report" before approval
 */

import { AgentRole, AgentOutput } from '../models/agentTypes';
import { DiscussionMessage, MessageType, MessageSeverity } from './DiscussionThread';
import { ConsensusReportFormatter } from './ConsensusReportFormatter';
import { ConsensusAnalyzer } from './ConsensusAnalyzer';

/**
 * Consensus level for a topic
 */
export enum ConsensusLevel {
  /** All agents agree */
  UNANIMOUS = 'unanimous',

  /** Majority agrees (>75%) */
  STRONG = 'strong',

  /** Moderate agreement (50-75%) */
  MODERATE = 'moderate',

  /** Weak agreement (<50%) */
  WEAK = 'weak',

  /** No consensus, conflict */
  CONFLICT = 'conflict',
}

/**
 * Agent opinion on a topic
 */
export interface AgentOpinion {
  /** Agent */
  agent: AgentRole;

  /** Opinion type */
  stance: 'APPROVE' | 'CONCERN' | 'REJECT' | 'NEUTRAL';

  /** Reasoning */
  reasoning: string;

  /** Severity (for concerns) */
  severity?: MessageSeverity;
}

/**
 * Consensus on a specific topic
 */
export interface TopicConsensus {
  /** Topic */
  topic: string;

  /** Consensus level */
  level: ConsensusLevel;

  /** Agents in agreement */
  agreeCount: number;

  /** Agents with concerns */
  concernCount: number;

  /** Agents rejecting */
  rejectCount: number;

  /** All opinions */
  opinions: AgentOpinion[];

  /** Summary */
  summary: string;
}

/**
 * Full consensus report
 */
export interface ConsensusReport {
  /** Overall consensus level */
  overallConsensus: ConsensusLevel;

  /** Total agents involved */
  totalAgents: number;

  /** Agents who participated */
  participants: AgentRole[];

  /** Consensus by topic */
  topics: TopicConsensus[];

  /** Unresolved concerns */
  unresolvedConcerns: DiscussionMessage[];

  /** Conflicts requiring escalation */
  conflicts: string[];

  /** Recommendation */
  recommendation: 'APPROVE' | 'REVISE' | 'ESCALATE' | 'REJECT';

  /** Reasoning for recommendation */
  reasoning: string;

  /** Timestamp */
  timestamp: Date;
}

/**
 * ConsensusReporter - Generates consensus reports
 *
 * Responsibilities:
 * - Collect opinions from all agents
 * - Analyze agreement levels
 * - Identify conflicts
 * - Generate consensus report
 * - Recommend next action
 */
export class ConsensusReporter {
  /**
   * Generate consensus report from discussion messages
   */
  generateReport(
    messages: DiscussionMessage[],
    participants: AgentRole[]
  ): ConsensusReport {
    const opinions = ConsensusAnalyzer.extractOpinions(messages);
    const topics = ConsensusAnalyzer.groupByTopic(
      opinions,
      messages,
      this.quickConsensusCheck.bind(this)
    );
    const unresolvedConcerns = ConsensusAnalyzer.extractUnresolvedConcerns(
      messages
    );
    const conflicts = ConsensusAnalyzer.identifyConflicts(topics);

    const overallConsensus = ConsensusAnalyzer.calculateOverallConsensus(
      topics
    );
    const recommendation = ConsensusAnalyzer.determineRecommendation(
      overallConsensus,
      unresolvedConcerns,
      conflicts
    );

    return {
      overallConsensus,
      totalAgents: participants.length,
      participants,
      topics,
      unresolvedConcerns,
      conflicts,
      recommendation,
      reasoning: ConsensusReportFormatter.generateReasoning(
        overallConsensus,
        unresolvedConcerns.length,
        conflicts.length,
        conflicts
      ),
      timestamp: new Date(),
    };
  }

  /**
   * Generate a simplified consensus check (quick version)
   */
  quickConsensusCheck(
    approvals: number,
    concerns: number,
    rejections: number,
    totalAgents: number
  ): ConsensusLevel {
    const agreePercent = (approvals / totalAgents) * 100;

    if (rejections > 0) {
      return ConsensusLevel.CONFLICT;
    }

    if (agreePercent === 100) {
      return ConsensusLevel.UNANIMOUS;
    }

    if (agreePercent > 75) {
      return ConsensusLevel.STRONG;
    }

    if (agreePercent >= 50) {
      return ConsensusLevel.MODERATE;
    }

    return ConsensusLevel.WEAK;
  }

  /**
   * Format consensus report as human-readable text
   */
  formatReport(report: ConsensusReport): string {
    return ConsensusReportFormatter.formatReport(report);
  }

}

/**
 * Singleton instance
 */
export const consensusReporter = new ConsensusReporter();

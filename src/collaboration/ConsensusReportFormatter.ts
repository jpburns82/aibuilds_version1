/**
 * ConsensusReportFormatter - Format consensus reports for display
 *
 * PHASE 3 - HELPER MODULE
 *
 * Purpose: Format consensus reports as human-readable text
 * Separated from ConsensusReporter to maintain <300 line limit
 */

import { ConsensusReport, ConsensusLevel, TopicConsensus } from './ConsensusReporter';

/**
 * Formats consensus reports for human consumption
 */
export class ConsensusReportFormatter {
  /**
   * Format full consensus report as human-readable text
   */
  static formatReport(report: ConsensusReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('AGENT CONSENSUS REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`Overall Consensus: ${report.overallConsensus.toUpperCase()}`);
    lines.push(
      `Participants: ${report.totalAgents} agents (${report.participants.join(', ')})`
    );
    lines.push('');

    lines.push('TOPICS:');
    for (const topic of report.topics) {
      lines.push(`- ${topic.topic}: ${topic.level.toUpperCase()}`);
      lines.push(
        `  Agree: ${topic.agreeCount}, Concerns: ${topic.concernCount}, Reject: ${topic.rejectCount}`
      );
    }
    lines.push('');

    if (report.unresolvedConcerns.length > 0) {
      lines.push(`UNRESOLVED CONCERNS: ${report.unresolvedConcerns.length}`);
      for (const concern of report.unresolvedConcerns) {
        lines.push(`- [${concern.author}] ${concern.content}`);
      }
      lines.push('');
    }

    if (report.conflicts.length > 0) {
      lines.push('CONFLICTS:');
      for (const conflict of report.conflicts) {
        lines.push(`- ${conflict}`);
      }
      lines.push('');
    }

    lines.push(`RECOMMENDATION: ${report.recommendation}`);
    lines.push(`Reasoning: ${report.reasoning}`);
    lines.push('');

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Format topic consensus summary
   */
  static summarizeTopicConsensus(
    level: ConsensusLevel,
    agree: number,
    concerns: number,
    reject: number
  ): string {
    return `${level} consensus (${agree} agree, ${concerns} concerns, ${reject} reject)`;
  }

  /**
   * Generate reasoning text for recommendation
   */
  static generateReasoning(
    consensus: ConsensusLevel,
    concernCount: number,
    conflictCount: number,
    conflicts: string[]
  ): string {
    if (conflictCount > 0) {
      return `Conflicts detected: ${conflicts.join(', ')}. Escalating to LeadArchitect.`;
    }

    if (consensus === ConsensusLevel.UNANIMOUS) {
      return 'All agents agree. Implementation is ready for approval.';
    }

    if (consensus === ConsensusLevel.STRONG && concernCount === 0) {
      return 'Strong consensus with no major concerns. Ready for approval.';
    }

    if (concernCount > 0) {
      return `${concernCount} unresolved concern(s). Recommend addressing concerns before approval.`;
    }

    return 'Moderate consensus. Review recommended.';
  }
}

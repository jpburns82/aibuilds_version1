import { AgentOutput, Decision } from '../models/agentTypes';

export class ReviewCombiner {
  static parseLeadArchitectDecision(output: AgentOutput): Decision {
    const content = output.content;

    const isApproved = content.toUpperCase().includes('DECISION: APPROVED') ||
                       content.toUpperCase().includes('DECISION:APPROVED');

    const status = isApproved ? 'APPROVED' : 'REJECTED';

    let reasoning = '';
    let finalDeliverable: string | undefined;
    let revisionInstructions: string[] | undefined;

    const reasoningMatch = content.match(/REASONING:\s*([\s\S]*?)(?=FINAL DELIVERABLE:|REVISION INSTRUCTIONS:|$)/i);
    if (reasoningMatch) {
      reasoning = reasoningMatch[1].trim();
    }

    if (status === 'APPROVED') {
      const deliverableMatch = content.match(/FINAL DELIVERABLE:\s*([\s\S]*?)$/i);
      if (deliverableMatch) {
        finalDeliverable = deliverableMatch[1].trim();
      } else {
        finalDeliverable = content;
      }
    } else {
      const instructionsMatch = content.match(/REVISION INSTRUCTIONS:\s*([\s\S]*?)$/i);
      if (instructionsMatch) {
        const instructionsText = instructionsMatch[1].trim();
        revisionInstructions = instructionsText
          .split('\n')
          .filter(line => line.trim().match(/^\d+\./))
          .map(line => line.trim());
      }
    }

    return {
      status,
      reasoning,
      finalDeliverable,
      revisionInstructions
    };
  }

  static combineOutputs(outputs: AgentOutput[]): string {
    return outputs
      .map(output => `=== ${output.role.toUpperCase()} ===\n${output.content}`)
      .join('\n\n');
  }

  static formatFinalOutput(decision: Decision): string {
    if (decision.status === 'APPROVED') {
      return ` APPROVED  MVP architecture + code outline validated.

${decision.reasoning}

FINAL DELIVERABLE:
${decision.finalDeliverable || 'No deliverable provided'}`;
    } else {
      const instructions = decision.revisionInstructions?.join('\n') || 'No specific instructions provided';
      return ` REJECTED  Issues detected that need resolution.

${decision.reasoning}

REQUIRED FIXES:
${instructions}`;
    }
  }
}

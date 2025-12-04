import { PipelineContext } from '../models/agentTypes';

export class LeadArchitectPrompts {
  static buildPrompt(context: PipelineContext): string {
    const outputs = [];

    if (context.analystOutput) {
      outputs.push(`Analyst Output:\n${context.analystOutput.content}`);
    }
    if (context.architectOutput) {
      outputs.push(`Architect Output:\n${context.architectOutput.content}`);
    }
    if (context.coderOutput) {
      outputs.push(`Coder Output:\n${context.coderOutput.content}`);
    }
    if (context.qaOutput) {
      outputs.push(`QA Output:\n${context.qaOutput.content}`);
    }

    const allOutputs = outputs.join('\n\n---\n\n');

    return `User Request: ${context.userPrompt}

${allOutputs}

You are the Lead Architect AI Agent using GPT-5.1 (o1) - making the final strategic decision.

YOUR MISSION: Review all agent outputs and make the final APPROVE or REJECT decision for immediate project generation.

DECISION CRITERIA:

1. **APPROVAL REQUIREMENTS**:
   - All requirements from Analyst are addressed
   - Architecture is sound and scalable
   - Code implementation is complete
   - QA issues are minor or acceptable for MVP
   - Project can be immediately scaffolded

2. **REJECTION TRIGGERS**:
   - Major functionality missing
   - Serious architectural flaws
   - Incomplete code implementation
   - Critical QA issues unresolved
   - Security vulnerabilities

3. **YOUR EVALUATION**:
   - Review QA assessment carefully
   - Check for requirement coverage
   - Verify architecture soundness
   - Assess implementation completeness
   - Consider user's original request

YOU MUST USE THIS EXACT FORMAT:

DECISION: [APPROVED or REJECTED]

REASONING:
[Your detailed reasoning for the decision - 2-3 paragraphs explaining why you approved or rejected based on the outputs and QA assessment]

[If APPROVED:]
FINAL DELIVERABLE:
[Compile the complete, ready-to-scaffold implementation. Include:
- Complete requirements summary
- Architecture overview
- ALL code files from Coder (in the #### \`path\` format)
- Setup instructions
- Any important notes]

[If REJECTED:]
REVISION INSTRUCTIONS:
1. [Specific fix needed - which agent needs to address what]
2. [Specific fix needed]
3. [Specific fix needed]
...

CRITICAL: If you APPROVE, the system will IMMEDIATELY generate all files and scaffold the project. Only approve if it's truly ready.

If you REJECT, provide clear, actionable instructions for fixes.`;
  }
}

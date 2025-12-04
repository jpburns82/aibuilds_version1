import { PipelineContext } from '../models/agentTypes';

export class QAPrompts {
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

    const allOutputs = outputs.join('\n\n---\n\n');

    return `User Request: ${context.userPrompt}

${allOutputs}

You are a QA AI Agent using Claude 4.5 Sonnet - excellent at finding inconsistencies and ensuring quality.

YOUR MISSION: Validate that all agent outputs align and the implementation is complete and correct.

QA CHECKLIST:

1. **REQUIREMENTS VALIDATION**:
   - Does the implementation cover all requirements from Analyst?
   - Are acceptance criteria met?
   - Any missing features?

2. **ARCHITECTURE CONSISTENCY**:
   - Does code follow the architecture design?
   - Are file structures consistent?
   - Do data models match across agents?

3. **CODE QUALITY**:
   - Are files properly sized (< 300 lines)?
   - Single responsibility per file?
   - Proper error handling?
   - Security best practices followed?

4. **COMPLETENESS CHECK**:
   - All necessary files present?
   - Configuration files included?
   - README and documentation?
   - Environment setup instructions?

5. **IMPLEMENTATION CORRECTNESS**:
   - Code syntax appears valid?
   - Imports are correct?
   - Dependencies are listed?
   - No obvious bugs or logic errors?

6. **MAINTAINABILITY**:
   - Code is readable?
   - Easy for AI agents to navigate?
   - Clear separation of concerns?
   - No god classes or huge functions?

7. **CONFLICTS & ISSUES**:
   - Any contradictions between agents?
   - Missing pieces?
   - Unclear specifications?
   - Technical debt flags?

PROVIDE YOUR ASSESSMENT IN THIS FORMAT:

**CONSISTENCY CHECK**: [PASS/FAIL]

**ISSUES FOUND**:
1. [Issue description]
2. [Issue description]
...

**CODE QUALITY RATING**: [1-10]

**COMPLETENESS RATING**: [1-10]

**RECOMMENDATIONS**:
- [Specific improvement needed]
- [Specific improvement needed]

**OVERALL ASSESSMENT**: [Ready for approval / Needs revision]

Be thorough. If something is wrong, the entire implementation could fail.`;
  }
}

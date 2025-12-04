import { PipelineContext, AgentRole } from '../models/agentTypes';
import { AnalystPrompts } from '../prompts/analystPrompts';
import { ArchitectPrompts } from '../prompts/architectPrompts';
import { CoderPrompts } from '../prompts/coderPrompts';
import { QAPrompts } from '../prompts/qaPrompts';
import { LeadArchitectPrompts } from '../prompts/leadArchitectPrompts';

export class PromptBuilder {
  static buildPrompt(role: AgentRole, context: PipelineContext): string {
    switch (role) {
      case 'analyst':
        return AnalystPrompts.buildPrompt(context);
      case 'architect':
        return ArchitectPrompts.buildPrompt(context);
      case 'coder':
        return CoderPrompts.buildPrompt(context);
      case 'qa':
        return QAPrompts.buildPrompt(context);
      case 'leadArchitect':
        return LeadArchitectPrompts.buildPrompt(context);
      default:
        return `User Request: ${context.userPrompt}`;
    }
  }

}

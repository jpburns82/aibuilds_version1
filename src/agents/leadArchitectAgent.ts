import { BaseAgent } from './baseAgent';
import { ModelProvider } from '../models/agentTypes';

export class LeadArchitectAgent extends BaseAgent {
  constructor(model: string, provider: ModelProvider) {
    super('leadArchitect', model, provider);
  }

  getName(): string {
    return 'Lead Architect Agent';
  }
}

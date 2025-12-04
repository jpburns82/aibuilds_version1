import { BaseAgent } from './baseAgent';
import { ModelProvider } from '../models/agentTypes';

export class ArchitectAgent extends BaseAgent {
  constructor(model: string, provider: ModelProvider) {
    super('architect', model, provider);
  }

  getName(): string {
    return 'Architect Agent';
  }
}

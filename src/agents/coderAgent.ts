import { BaseAgent } from './baseAgent';
import { ModelProvider } from '../models/agentTypes';

export class CoderAgent extends BaseAgent {
  constructor(model: string, provider: ModelProvider) {
    super('coder', model, provider);
  }

  getName(): string {
    return 'Coder Agent';
  }
}

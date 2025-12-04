import { BaseAgent } from './baseAgent';
import { ModelProvider } from '../models/agentTypes';

export class AnalystAgent extends BaseAgent {
  constructor(model: string, provider: ModelProvider) {
    super('analyst', model, provider);
  }

  getName(): string {
    return 'Analyst Agent';
  }
}

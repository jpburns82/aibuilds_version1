import { BaseAgent } from './baseAgent';
import { ModelProvider } from '../models/agentTypes';

export class QAAgent extends BaseAgent {
  constructor(model: string, provider: ModelProvider) {
    super('qa', model, provider);
  }

  getName(): string {
    return 'QA Agent';
  }
}

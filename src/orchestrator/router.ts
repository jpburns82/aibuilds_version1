import { AgentRole } from '../models/agentTypes';

export class Router {
  static getPipelineOrder(userPrompt: string): AgentRole[] {
    return ['analyst', 'architect', 'coder', 'qa', 'leadArchitect'];
  }
}

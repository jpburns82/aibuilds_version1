import { AgentRole, AgentOutput, ModelProvider } from '../models/agentTypes';
import { Message } from '../models/messageTypes';
import { OpenAIClient } from '../clients/openaiClient';
import { ClaudeClient } from '../clients/claudeClient';
import { Logger } from '../utils/logger';

export abstract class BaseAgent {
  protected client: OpenAIClient | ClaudeClient;
  protected role: AgentRole;
  protected modelName: string;

  constructor(role: AgentRole, model: string, provider: ModelProvider) {
    this.role = role;
    this.modelName = model;

    if (provider === 'openai') {
      this.client = new OpenAIClient(model);
    } else {
      this.client = new ClaudeClient(model);
    }
  }

  async run(prompt: string): Promise<AgentOutput> {
    Logger.step(`Running ${this.role} agent`, this.role);

    try {
      const messages: Message[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.client.chat(messages);

      Logger.info(`${this.role} completed`, {
        tokens: response.usage?.total_tokens,
      });

      return {
        role: this.role,
        content: response.content,
        metadata: {
          model: this.modelName,
          usage: response.usage,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      Logger.error(`${this.role} failed`, error);
      throw error;
    }
  }

  abstract getName(): string;
}

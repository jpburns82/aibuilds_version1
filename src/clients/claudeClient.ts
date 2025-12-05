import Anthropic from '@anthropic-ai/sdk';
import { Message, ChatCompletion } from '../models/messageTypes';
import { env } from '../utils/env';

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-5-20250929') {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
    this.model = model;
  }

  async chat(messages: Message[], temperature: number = 0.7, maxTokens: number = 4000): Promise<ChatCompletion> {
    try {
      const systemMessage = messages.find(msg => msg.role === 'system');
      const userMessages = messages.filter(msg => msg.role !== 'system');

      const anthropicMessages = userMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content,
      }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content,
        messages: anthropicMessages,
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const usage = response.usage;

      return {
        content,
        usage: usage ? {
          prompt_tokens: usage.input_tokens,
          completion_tokens: usage.output_tokens,
          total_tokens: usage.input_tokens + usage.output_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

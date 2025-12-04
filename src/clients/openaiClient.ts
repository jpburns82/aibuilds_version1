import OpenAI from 'openai';
import { Message, ChatCompletion } from '../models/messageTypes';
import { env } from '../utils/env';

export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-4o') {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.model = model;
  }

  async chat(messages: Message[], temperature: number = 0.7, maxTokens: number = 4000): Promise<ChatCompletion> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return {
        content,
        usage: usage ? {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

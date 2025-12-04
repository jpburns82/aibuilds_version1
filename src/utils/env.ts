import * as dotenv from 'dotenv';
import * as path from 'path';

// Load from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};

export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (!env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and add your API keys.'
    );
  }
}

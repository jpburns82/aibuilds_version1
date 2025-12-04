#!/usr/bin/env node

import { Pipeline } from './src/orchestrator/pipeline';
import { ReviewCombiner } from './src/utils/reviewCombiner';
import { Logger } from './src/utils/logger';
import { validateEnv } from './src/utils/env';

async function main() {
  try {
    validateEnv();

    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log(`
AI Engineering Team - Multi-Agent Orchestrator

Usage:
  npm start "your prompt here"

Example:
  npm start "build me a CRUD microservice for users"

The system will route your request through:
  1. Analyst - breaks down requirements
  2. Architect - designs the system
  3. Coder - creates implementation plan
  4. QA - validates consistency
  5. Lead Architect - makes final approval/rejection

Environment Setup:
  Copy .env.example to .env and add your API keys:
    - OPENAI_API_KEY
    - ANTHROPIC_API_KEY
      `);
      process.exit(0);
    }

    const userPrompt = args.join(' ');

    Logger.info('AI Engineering Team Starting', {
      prompt: userPrompt,
    });

    const pipeline = new Pipeline();
    const decision = await pipeline.run(userPrompt);

    console.log('\n' + '='.repeat(80));
    console.log('FINAL RESULT');
    console.log('='.repeat(80) + '\n');

    const formattedOutput = ReviewCombiner.formatFinalOutput(decision);
    console.log(formattedOutput);

    console.log('\n' + '='.repeat(80) + '\n');

    process.exit(decision.status === 'APPROVED' ? 0 : 1);
  } catch (error) {
    Logger.error('Pipeline failed', error);
    console.error('\nFatal error occurred. Please check your configuration and API keys.');
    process.exit(1);
  }
}

main();

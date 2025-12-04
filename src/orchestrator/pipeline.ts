import { PipelineContext, Decision } from '../models/agentTypes';
import { AnalystAgent } from '../agents/analystAgent';
import { ArchitectAgent } from '../agents/architectAgent';
import { CoderAgent } from '../agents/coderAgent';
import { QAAgent } from '../agents/qaAgent';
import { LeadArchitectAgent } from '../agents/leadArchitectAgent';
import { PromptBuilder } from '../utils/promptBuilder';
import { ReviewCombiner } from '../utils/reviewCombiner';
import { Logger } from '../utils/logger';
import { Router } from './router';
import * as fs from 'fs';
import * as path from 'path';

interface AgentConfigItem {
  model: string;
  provider: 'openai' | 'anthropic';
}

interface AgentConfigs {
  analyst: AgentConfigItem;
  architect: AgentConfigItem;
  coder: AgentConfigItem;
  qa: AgentConfigItem;
  leadArchitect: AgentConfigItem;
}

export class Pipeline {
  private config: AgentConfigs;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AgentConfigs {
    const configPath = path.resolve(__dirname, '../../config/agents.config.json');

    if (!fs.existsSync(configPath)) {
      Logger.warn('Config file not found, using defaults');
      return {
        analyst: { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
        architect: { model: 'gpt-4o', provider: 'openai' },
        coder: { model: 'gpt-4o', provider: 'openai' },
        qa: { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
        leadArchitect: { model: 'gpt-4o', provider: 'openai' },
      };
    }

    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  }

  async run(userPrompt: string): Promise<Decision> {
    Logger.info('Starting pipeline', { prompt: userPrompt });

    const context: PipelineContext = {
      userPrompt,
    };

    const pipelineOrder = Router.getPipelineOrder(userPrompt);

    for (const role of pipelineOrder) {
      const prompt = PromptBuilder.buildPrompt(role, context);
      let output;

      switch (role) {
        case 'analyst': {
          const agent = new AnalystAgent(
            this.config.analyst.model,
            this.config.analyst.provider
          );
          output = await agent.run(prompt);
          context.analystOutput = output;
          break;
        }

        case 'architect': {
          const agent = new ArchitectAgent(
            this.config.architect.model,
            this.config.architect.provider
          );
          output = await agent.run(prompt);
          context.architectOutput = output;
          break;
        }

        case 'coder': {
          const agent = new CoderAgent(
            this.config.coder.model,
            this.config.coder.provider
          );
          output = await agent.run(prompt);
          context.coderOutput = output;
          break;
        }

        case 'qa': {
          const agent = new QAAgent(
            this.config.qa.model,
            this.config.qa.provider
          );
          output = await agent.run(prompt);
          context.qaOutput = output;
          break;
        }

        case 'leadArchitect': {
          const agent = new LeadArchitectAgent(
            this.config.leadArchitect.model,
            this.config.leadArchitect.provider
          );
          output = await agent.run(prompt);
          context.leadArchitectOutput = output;
          break;
        }
      }
    }

    if (!context.leadArchitectOutput) {
      throw new Error('Lead Architect did not produce output');
    }

    const decision = ReviewCombiner.parseLeadArchitectDecision(context.leadArchitectOutput);

    Logger.info('Pipeline complete', { status: decision.status });

    return decision;
  }
}

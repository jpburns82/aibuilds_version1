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
import { ProjectScaffolder } from '../generators/projectScaffolder';
import { blueprintGenerator } from '../blueprint/BlueprintGenerator';
import { parseArchitectOutput, runValidators } from './pipelineHelpers';
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

export type AgentEventCallback = (event: {
  agent: string;
  status: 'started' | 'completed';
  content?: string;
}) => void;

export class Pipeline {
  private config: AgentConfigs;
  private onAgentEvent?: AgentEventCallback;

  constructor(onAgentEvent?: AgentEventCallback) {
    this.config = this.loadConfig();
    this.onAgentEvent = onAgentEvent;
  }

  private loadConfig(): AgentConfigs {
    const configPath = path.resolve(__dirname, '../../config/agents.config.json');

    if (!fs.existsSync(configPath)) {
      Logger.warn('Config file not found, using defaults');
      return {
        analyst: { model: 'o1', provider: 'openai' },
        architect: { model: 'claude-sonnet-4-5-20250929', provider: 'anthropic' },
        coder: { model: 'claude-sonnet-4-5-20250929', provider: 'anthropic' },
        qa: { model: 'claude-sonnet-4-5-20250929', provider: 'anthropic' },
        leadArchitect: { model: 'o1', provider: 'openai' },
      };
    }

    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  }

  private extractProjectName(userPrompt: string): string {
    return userPrompt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }


  async run(userPrompt: string): Promise<Decision> {
    Logger.info('Starting pipeline', { prompt: userPrompt });

    const context: PipelineContext = {
      userPrompt,
    };

    const pipelineOrder = Router.getPipelineOrder(userPrompt);

    for (const role of pipelineOrder) {
      this.onAgentEvent?.({ agent: role, status: 'started' });
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
          this.onAgentEvent?.({ agent: role, status: 'completed', content: output.content });
          break;
        }

        case 'architect': {
          const agent = new ArchitectAgent(
            this.config.architect.model,
            this.config.architect.provider
          );
          output = await agent.run(prompt);
          context.architectOutput = output;
          this.onAgentEvent?.({ agent: role, status: 'completed', content: output.content });

          // Generate blueprint from architect output
          try {
            Logger.step('Generating blueprint from architecture specification');
            const projectName = this.extractProjectName(userPrompt);
            const architectSpec = parseArchitectOutput(
              output.content,
              projectName,
              userPrompt
            );

            const blueprintResult = await blueprintGenerator.generateAndSave(architectSpec);

            if (blueprintResult.success && blueprintResult.savedTo) {
              context.blueprintPath = blueprintResult.savedTo;
              context.projectMode = architectSpec.projectMode;
              Logger.info(`Blueprint generated: ${blueprintResult.savedTo}`);
            } else {
              Logger.warn('Blueprint generation failed', blueprintResult.errors);
            }
          } catch (error) {
            Logger.error('Failed to generate blueprint', error);
          }

          break;
        }

        case 'coder': {
          const agent = new CoderAgent(
            this.config.coder.model,
            this.config.coder.provider
          );
          output = await agent.run(prompt);
          context.coderOutput = output;
          this.onAgentEvent?.({ agent: role, status: 'completed', content: output.content });
          break;
        }

        case 'qa': {
          const agent = new QAAgent(
            this.config.qa.model,
            this.config.qa.provider
          );
          output = await agent.run(prompt);
          context.qaOutput = output;
          this.onAgentEvent?.({ agent: role, status: 'completed', content: output.content });

          // Run blueprint validators after QA
          if (context.blueprintPath) {
            const validationReport = await runValidators(
              context.blueprintPath,
              context.projectMode
            );
            context.validationReport = validationReport;

            // If validation fails critically, log it
            if (validationReport && !validationReport.valid) {
              Logger.warn('Blueprint validation failed - project may not meet standards', {
                critical: validationReport.summary.critical,
                errors: validationReport.summary.errors,
              });
            }
          } else {
            Logger.warn('No blueprint path available for validation');
          }

          break;
        }

        case 'leadArchitect': {
          const agent = new LeadArchitectAgent(
            this.config.leadArchitect.model,
            this.config.leadArchitect.provider
          );
          output = await agent.run(prompt);
          context.leadArchitectOutput = output;
          this.onAgentEvent?.({ agent: role, status: 'completed', content: output.content });
          break;
        }
      }
    }

    if (!context.leadArchitectOutput) {
      throw new Error('Lead Architect did not produce output');
    }

    const decision = ReviewCombiner.parseLeadArchitectDecision(context.leadArchitectOutput);

    Logger.info('Pipeline complete', { status: decision.status });

    // Phase 1: Scaffold project if approved
    if (decision.status === 'APPROVED') {
      try {
        Logger.step('Scaffolding approved project');

        const scaffolder = new ProjectScaffolder('./output');
        const projectName = this.extractProjectName(userPrompt);

        const agentOutputs = [];
        if (context.architectOutput) {
          agentOutputs.push({ role: 'architect', content: context.architectOutput.content });
        }
        if (context.coderOutput) {
          agentOutputs.push({ role: 'coder', content: context.coderOutput.content });
        }

        const projectStructure = scaffolder.parseAgentOutputToProject(projectName, agentOutputs);
        const result = scaffolder.scaffoldProject(projectStructure, context.blueprintPath);

        if (result.success) {
          decision.projectPath = result.projectPath;
          Logger.info(`Project scaffolded successfully: ${result.projectPath}`);
          Logger.info(`Files created: ${result.filesCreated}`);
        } else {
          Logger.warn('Project scaffolding completed with errors', result.errors);
          decision.projectPath = result.projectPath;
        }
      } catch (error) {
        Logger.error('Failed to scaffold project', error);
      }
    }

    return decision;
  }
}

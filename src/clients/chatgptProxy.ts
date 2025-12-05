/**
 * ChatGPT Proxy Service
 *
 * Handles ideation chat between user and ChatGPT.
 * ChatGPT acts as the external Lead Human Architect who:
 * - Gathers requirements from user
 * - Clarifies scope and features
 * - Produces a Build Plan Packet
 * - Triggers the internal agent pipeline
 */

import { OpenAIClient } from './openaiClient';

export interface BuildPlanPacket {
  projectName: string;
  projectGoal: string;
  features: string[];
  strictnessMode: 'prototype' | 'mvp' | 'production';
  technicalStack: string[];
  constraints: string[];
  expectedDeliverables: string[];
  phase: 'ideation' | 'planning' | 'ready-to-build';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are the Lead Architect for AI-Builds, an AI-powered software development system.

Your role is to help users plan and scope their software projects BEFORE any code is written.

IMPORTANT RULES:
1. You gather requirements through conversation
2. You clarify ambiguous requests
3. You suggest features and technical approaches
4. You help users choose the right strictness mode:
   - prototype: Fast iteration, minimal validation
   - mvp: Balanced quality and speed
   - production: Full validation, enterprise-grade

5. When the user is ready, you produce a BUILD PLAN PACKET in JSON format

WORKFLOW:
1. Greet the user and ask what they want to build
2. Ask clarifying questions about features, target users, technical preferences
3. Summarize the project scope
4. When ready, output the Build Plan Packet

BUILD PLAN PACKET FORMAT (output when user confirms):
\`\`\`json
{
  "projectName": "project-name-here",
  "projectGoal": "One sentence describing the project",
  "features": ["feature1", "feature2", ...],
  "strictnessMode": "prototype" | "mvp" | "production",
  "technicalStack": ["tech1", "tech2", ...],
  "constraints": ["constraint1", ...],
  "expectedDeliverables": ["deliverable1", ...],
  "phase": "ready-to-build"
}
\`\`\`

Be conversational, helpful, and thorough. Ask questions before assuming.
When you output a Build Plan Packet, explain each field to the user.`;

class ChatGPTProxy {
  private client: OpenAIClient;
  private conversationHistory: ChatMessage[] = [];
  private currentPlan: Partial<BuildPlanPacket> = {};

  constructor() {
    this.client = new OpenAIClient();
    this.reset();
  }

  reset(): void {
    this.conversationHistory = [];
    this.currentPlan = {
      phase: 'ideation',
      strictnessMode: 'mvp',
      features: [],
      technicalStack: [],
      constraints: [],
      expectedDeliverables: [],
    };
  }

  async chat(userMessage: string): Promise<{ response: string; plan: Partial<BuildPlanPacket> }> {
    // Add user message to history
    this.conversationHistory.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Build messages for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...this.conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call ChatGPT (temperature, maxTokens)
    const response = await this.client.chat(messages, 0.7, 2000);

    const assistantMessage = response.content;

    // Add assistant response to history
    this.conversationHistory.push({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
    });

    // Try to extract Build Plan Packet if present
    const extractedPlan = this.extractBuildPlan(assistantMessage);
    if (extractedPlan) {
      this.currentPlan = { ...this.currentPlan, ...extractedPlan };
    }

    return {
      response: assistantMessage,
      plan: this.currentPlan,
    };
  }

  private extractBuildPlan(text: string): Partial<BuildPlanPacket> | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      // Validate it has expected fields
      if (parsed.projectName && parsed.phase) {
        return parsed as BuildPlanPacket;
      }
    } catch {
      // Not valid JSON
    }
    return null;
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  getPlan(): Partial<BuildPlanPacket> {
    return { ...this.currentPlan };
  }

  isReadyToBuild(): boolean {
    return this.currentPlan.phase === 'ready-to-build' &&
      !!this.currentPlan.projectName &&
      !!this.currentPlan.projectGoal;
  }

  getBuildPrompt(): string {
    if (!this.isReadyToBuild()) {
      throw new Error('Build plan is not ready');
    }

    const plan = this.currentPlan;
    return `Build a ${plan.strictnessMode} project called "${plan.projectName}".

Goal: ${plan.projectGoal}

Features:
${plan.features?.map(f => `- ${f}`).join('\n') || '- Core functionality'}

Technical Stack: ${plan.technicalStack?.join(', ') || 'Best practices'}

Constraints:
${plan.constraints?.map(c => `- ${c}`).join('\n') || '- None specified'}

Expected Deliverables:
${plan.expectedDeliverables?.map(d => `- ${d}`).join('\n') || '- Working application'}`;
  }
}

export const chatgptProxy = new ChatGPTProxy();

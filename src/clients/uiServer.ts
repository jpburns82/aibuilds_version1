/**
 * UI Server
 *
 * HTTP/REST bridge between the UI and the pipeline/VM systems.
 * Provides JSON endpoints for the React frontend.
 */

import * as http from 'http';
import * as path from 'path';
import { buildFileTree, readFileContent } from './fsBridge';
import { vmBridge } from './vmBridge';
import { chatgptProxy } from './chatgptProxy';
import { Pipeline, AgentEventCallback } from '../orchestrator/pipeline';
import { parseBlueprint } from '../blueprint/BlueprintSchema';
import * as fs from 'fs';

/**
 * Pipeline state for UI consumption
 */
interface UIState {
  status: string;
  currentAgent: string | null;
  projectName: string | null;
  projectMode: string;
  blueprintPath: string | null;
  messages: Array<{
    id: string;
    agentRole: string;
    content: string;
    timestamp: Date;
  }>;
  error: string | null;
}

/**
 * Server state
 */
let pipelineState: UIState = {
  status: 'idle',
  currentAgent: null,
  projectName: null,
  projectMode: 'mvp',
  blueprintPath: null,
  messages: [],
  error: null,
};

let activePipeline: Pipeline | null = null;
let workspaceRoot = process.cwd();

/**
 * Parse JSON body from request
 */
async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: http.ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

/**
 * Handle CORS preflight
 */
function handleCORS(res: http.ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
}

/**
 * Route handlers
 */
const routes: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>> = {
  'GET /api/pipeline/state': async (_req, res) => {
    sendJSON(res, pipelineState);
  },

  'POST /api/pipeline/start': async (req, res) => {
    const body = await parseBody(req) as { prompt?: string; projectMode?: string };

    if (!body.prompt) {
      sendJSON(res, { error: 'Prompt is required' }, 400);
      return;
    }

    const projectName = body.prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '-');

    pipelineState = {
      status: 'running',
      currentAgent: 'analyst',
      projectName,
      projectMode: body.projectMode || 'mvp',
      blueprintPath: null,
      messages: [
        {
          id: `msg-${Date.now()}`,
          agentRole: 'analyst',
          content: `Hello! I'm the Analyst Agent. I'll help analyze your project request: "${body.prompt}".\n\nLet me understand your requirements and pass them to the Architect for planning.`,
          timestamp: new Date(),
        },
      ],
      error: null,
    };

    const handleAgentEvent: AgentEventCallback = (event) => {
      if (event.status === 'started') {
        pipelineState.currentAgent = event.agent;
        pipelineState.messages.push({
          id: `msg-${Date.now()}`,
          agentRole: event.agent,
          content: `[${event.agent.toUpperCase()}] Starting...`,
          timestamp: new Date(),
        });
      } else if (event.status === 'completed' && event.content) {
        // Truncate content for UI display (first 500 chars)
        const preview = event.content.length > 500
          ? event.content.substring(0, 500) + '...'
          : event.content;
        pipelineState.messages.push({
          id: `msg-${Date.now()}-done`,
          agentRole: event.agent,
          content: preview,
          timestamp: new Date(),
        });
      }
    };

    activePipeline = new Pipeline(handleAgentEvent);

    // Run pipeline in background
    activePipeline.run(body.prompt).then(decision => {
      pipelineState.status = decision.status === 'APPROVED' ? 'completed' : 'blocked';
      pipelineState.currentAgent = null;
      if (decision.projectPath) {
        workspaceRoot = decision.projectPath;
        pipelineState.blueprintPath = decision.projectPath;
      }
      pipelineState.messages.push({
        id: `msg-${Date.now()}-final`,
        agentRole: 'system',
        content: decision.status === 'APPROVED'
          ? 'Project approved and scaffolded successfully!'
          : `Project review complete. Status: ${decision.status}.`,
        timestamp: new Date(),
      });
    }).catch(error => {
      pipelineState.status = 'error';
      pipelineState.currentAgent = null;
      pipelineState.error = error instanceof Error ? error.message : 'Unknown error';
    });

    sendJSON(res, pipelineState);
  },

  'POST /api/pipeline/runStep': async (_req, res) => {
    // For demo: simulate step progression
    const agents = ['analyst', 'architect', 'coder', 'qa', 'leadArchitect'];
    const currentIndex = pipelineState.currentAgent
      ? agents.indexOf(pipelineState.currentAgent)
      : -1;

    if (currentIndex < agents.length - 1) {
      const nextAgent = agents[currentIndex + 1];
      pipelineState.currentAgent = nextAgent;

      // Add a demo message
      pipelineState.messages.push({
        id: `msg-${Date.now()}`,
        agentRole: nextAgent,
        content: `[${nextAgent.toUpperCase()}] Processing...`,
        timestamp: new Date(),
      });

      sendJSON(res, { ...pipelineState, message: pipelineState.messages.at(-1) });
    } else {
      pipelineState.status = 'completed';
      pipelineState.currentAgent = null;
      sendJSON(res, pipelineState);
    }
  },

  'POST /api/pipeline/stop': async (_req, res) => {
    pipelineState.status = 'idle';
    pipelineState.currentAgent = null;
    pipelineState.messages.push({
      id: `msg-${Date.now()}`,
      agentRole: 'system',
      content: 'Pipeline stopped by user.',
      timestamp: new Date(),
    });
    activePipeline = null;
    sendJSON(res, pipelineState);
  },

  'GET /api/fs/tree': async (req, res) => {
    const url = new URL(req.url || '', `http://localhost`);
    const basePath = url.searchParams.get('basePath') || workspaceRoot;

    const tree = buildFileTree(basePath);
    if (tree) {
      sendJSON(res, tree);
    } else {
      sendJSON(res, { error: 'Failed to build file tree' }, 500);
    }
  },

  'GET /api/fs/file': async (req, res) => {
    const url = new URL(req.url || '', `http://localhost`);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      sendJSON(res, { error: 'Path is required' }, 400);
      return;
    }

    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(workspaceRoot, filePath);

    const content = readFileContent(fullPath);
    if (content !== null) {
      sendJSON(res, { path: filePath, content });
    } else {
      sendJSON(res, { error: 'File not found' }, 404);
    }
  },

  'GET /api/validation/report': async (_req, res) => {
    if (!pipelineState.blueprintPath) {
      sendJSON(res, null);
      return;
    }

    try {
      const json = fs.readFileSync(pipelineState.blueprintPath, 'utf-8');
      const blueprint = parseBlueprint(json);
      sendJSON(res, blueprint);
    } catch {
      sendJSON(res, null);
    }
  },

  // ChatGPT Ideation Routes
  'POST /api/chat/message': async (req, res) => {
    const body = await parseBody(req) as { message?: string };

    if (!body.message) {
      sendJSON(res, { error: 'Message is required' }, 400);
      return;
    }

    try {
      const result = await chatgptProxy.chat(body.message);
      sendJSON(res, {
        response: result.response,
        plan: result.plan,
        history: chatgptProxy.getHistory(),
        readyToBuild: chatgptProxy.isReadyToBuild(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chat failed';
      sendJSON(res, { error: message }, 500);
    }
  },

  'GET /api/chat/state': async (_req, res) => {
    sendJSON(res, {
      history: chatgptProxy.getHistory(),
      plan: chatgptProxy.getPlan(),
      readyToBuild: chatgptProxy.isReadyToBuild(),
    });
  },

  'POST /api/chat/reset': async (_req, res) => {
    chatgptProxy.reset();
    sendJSON(res, { success: true });
  },

  'POST /api/chat/build': async (_req, res) => {
    if (!chatgptProxy.isReadyToBuild()) {
      sendJSON(res, { error: 'Build plan is not ready' }, 400);
      return;
    }

    const prompt = chatgptProxy.getBuildPrompt();
    const plan = chatgptProxy.getPlan();

    // Trigger pipeline with the build prompt
    const projectName = plan.projectName || 'untitled-project';

    pipelineState = {
      status: 'running',
      currentAgent: 'analyst',
      projectName,
      projectMode: plan.strictnessMode || 'mvp',
      blueprintPath: null,
      messages: [
        {
          id: `msg-${Date.now()}`,
          agentRole: 'system',
          content: `Build Plan received from ChatGPT Architect:\n\nProject: ${plan.projectName}\nGoal: ${plan.projectGoal}\nMode: ${plan.strictnessMode}\n\nStarting build process...`,
          timestamp: new Date(),
        },
      ],
      error: null,
    };

    const handleAgentEvent: AgentEventCallback = (event) => {
      if (event.status === 'started') {
        pipelineState.currentAgent = event.agent;
        pipelineState.messages.push({
          id: `msg-${Date.now()}`,
          agentRole: event.agent,
          content: `[${event.agent.toUpperCase()}] Starting...`,
          timestamp: new Date(),
        });
      } else if (event.status === 'completed' && event.content) {
        const preview = event.content.length > 500
          ? event.content.substring(0, 500) + '...'
          : event.content;
        pipelineState.messages.push({
          id: `msg-${Date.now()}-done`,
          agentRole: event.agent,
          content: preview,
          timestamp: new Date(),
        });
      }
    };

    activePipeline = new Pipeline(handleAgentEvent);

    activePipeline.run(prompt).then(decision => {
      pipelineState.status = decision.status === 'APPROVED' ? 'completed' : 'blocked';
      pipelineState.currentAgent = null;
      if (decision.projectPath) {
        workspaceRoot = decision.projectPath;
        pipelineState.blueprintPath = decision.projectPath;
      }
      pipelineState.messages.push({
        id: `msg-${Date.now()}-final`,
        agentRole: 'system',
        content: decision.status === 'APPROVED'
          ? 'Project approved and scaffolded successfully!'
          : `Project review complete. Status: ${decision.status}.`,
        timestamp: new Date(),
      });
    }).catch(error => {
      pipelineState.status = 'error';
      pipelineState.currentAgent = null;
      pipelineState.error = error instanceof Error ? error.message : 'Unknown error';
    });

    sendJSON(res, { success: true, pipelineState });
  },

  'POST /api/vm/run': async (req, res) => {
    const body = await parseBody(req) as { code?: string; language?: 'js' | 'ts' };

    if (!body.code) {
      sendJSON(res, { error: 'Code is required' }, 400);
      return;
    }

    const result = await vmBridge.runCode(body.code, body.language || 'js');
    sendJSON(res, result);
  },

  'GET /api/vm/stats': async (_req, res) => {
    sendJSON(res, vmBridge.getStats());
  },

  'GET /api/vm/runs': async (_req, res) => {
    sendJSON(res, vmBridge.getRecentRuns());
  },
};

/**
 * Create and start UI server
 */
export function createUIServer(port: number = 3001): http.Server {
  const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      handleCORS(res);
      return;
    }

    const routeKey = `${req.method} ${req.url?.split('?')[0]}`;
    const handler = routes[routeKey];

    if (handler) {
      try {
        await handler(req, res);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal error';
        sendJSON(res, { error: message }, 500);
      }
    } else {
      sendJSON(res, { error: 'Not found' }, 404);
    }
  });

  server.listen(port, () => {
    console.log(`UI Server running at http://localhost:${port}`);
  });

  return server;
}

/**
 * Set workspace root
 */
export function setWorkspaceRoot(root: string): void {
  workspaceRoot = root;
}

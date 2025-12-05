/**
 * WebSocket Server
 *
 * Real-time event streaming for pipeline and agent updates.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';

export interface WSEvent {
  type: 'agent-start' | 'agent-complete' | 'agent-message' | 'pipeline-status' | 'validation' | 'log';
  payload: Record<string, unknown>;
  timestamp: number;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: HTTPServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WS] Client connected. Total: ${clients.size}`);

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { message: 'Connected to AI-Builds WebSocket' },
      timestamp: Date.now(),
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch {
        console.error('[WS] Invalid message received');
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (error) => {
      console.error('[WS] Client error:', error.message);
      clients.delete(ws);
    });
  });

  console.log('[WS] WebSocket server initialized');
  return wss;
}

function handleClientMessage(ws: WebSocket, data: Record<string, unknown>) {
  const { type, payload } = data;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'subscribe':
      console.log('[WS] Client subscribed to:', payload);
      break;
    default:
      console.log('[WS] Unknown message type:', type);
  }
}

export function broadcast(event: WSEvent): void {
  if (!wss) return;

  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastAgentStart(agentName: string, projectName: string): void {
  broadcast({
    type: 'agent-start',
    payload: { agentName, projectName },
    timestamp: Date.now(),
  });
}

export function broadcastAgentComplete(
  agentName: string,
  success: boolean,
  output?: string
): void {
  broadcast({
    type: 'agent-complete',
    payload: { agentName, success, output },
    timestamp: Date.now(),
  });
}

export function broadcastAgentMessage(
  agentName: string,
  role: 'agent' | 'system',
  content: string
): void {
  broadcast({
    type: 'agent-message',
    payload: { agentName, role, content },
    timestamp: Date.now(),
  });
}

export function broadcastPipelineStatus(
  status: string,
  projectName?: string,
  currentAgent?: string
): void {
  broadcast({
    type: 'pipeline-status',
    payload: { status, projectName, currentAgent },
    timestamp: Date.now(),
  });
}

export function broadcastValidation(report: Record<string, unknown>): void {
  broadcast({
    type: 'validation',
    payload: report,
    timestamp: Date.now(),
  });
}

export function broadcastLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  source: string,
  message: string
): void {
  broadcast({
    type: 'log',
    payload: { level, source, message },
    timestamp: Date.now(),
  });
}

export function getConnectedClients(): number {
  return clients.size;
}

export function closeWebSocketServer(): void {
  if (wss) {
    clients.forEach((client) => client.close());
    clients.clear();
    wss.close();
    wss = null;
    console.log('[WS] WebSocket server closed');
  }
}

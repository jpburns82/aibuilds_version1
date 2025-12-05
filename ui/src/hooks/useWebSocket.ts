/**
 * useWebSocket Hook
 *
 * Real-time event streaming via WebSocket connection.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface WSEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  lastEvent: WSEvent | null;
}

type EventHandler = (event: WSEvent) => void;

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<number | null>(null);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    lastEvent: null,
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected');
        wsRef.current = ws;
        reconnectAttempts.current = 0;
        setState((prev) => ({ ...prev, connected: true, reconnecting: false }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          setState((prev) => ({ ...prev, lastEvent: data }));

          // Notify all handlers for this event type
          const handlers = handlersRef.current.get(data.type);
          handlers?.forEach((handler) => handler(data));

          // Notify wildcard handlers
          const wildcardHandlers = handlersRef.current.get('*');
          wildcardHandlers?.forEach((handler) => handler(data));
        } catch {
          console.error('[WS] Failed to parse message');
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        wsRef.current = null;
        setState((prev) => ({ ...prev, connected: false }));
        attemptReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (error) {
      console.error('[WS] Connection failed:', error);
      attemptReconnect();
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] Max reconnect attempts reached');
      setState((prev) => ({ ...prev, reconnecting: false }));
      return;
    }

    setState((prev) => ({ ...prev, reconnecting: true }));
    reconnectAttempts.current++;

    reconnectTimeout.current = window.setTimeout(() => {
      console.log(`[WS] Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
      connect();
    }, RECONNECT_INTERVAL);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({ connected: false, reconnecting: false, lastEvent: null });
  }, []);

  const send = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const subscribe = useCallback((eventType: string, handler: EventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    subscribe,
  };
}

// Singleton context for sharing WS connection across components
let globalWS: ReturnType<typeof useWebSocket> | null = null;

export function getGlobalWebSocket(): ReturnType<typeof useWebSocket> | null {
  return globalWS;
}

export function setGlobalWebSocket(ws: ReturnType<typeof useWebSocket>): void {
  globalWS = ws;
}

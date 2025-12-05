/**
 * usePipeline Hook
 *
 * Manages pipeline state and operations from the UI.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { PipelineState, ProjectMode, PipelineStatus, AgentMessage } from '../types';

const API_BASE = '/api';

const initialState: PipelineState = {
  status: 'idle',
  currentAgent: null,
  projectName: null,
  projectMode: 'mvp',
  blueprintPath: null,
  messages: [],
  error: null,
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(initialState);
  const [loading, setLoading] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/pipeline/state`);
      setState(prev => ({
        ...prev,
        ...response.data,
      }));
    } catch (error) {
      console.error('Failed to refresh pipeline state:', error);
    }
  }, []);

  const setProjectMode = useCallback((mode: ProjectMode) => {
    setState(prev => ({ ...prev, projectMode: mode }));
  }, []);

  const startSession = useCallback(async (prompt: string, mode: ProjectMode) => {
    setLoading(true);
    setState(prev => ({
      ...prev,
      status: 'running',
      error: null,
      messages: [],
    }));

    try {
      const response = await axios.post(`${API_BASE}/pipeline/start`, {
        prompt,
        projectMode: mode,
      });

      setState(prev => ({
        ...prev,
        ...response.data,
        status: response.data.status || 'running',
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const runNextStep = useCallback(async () => {
    if (state.status !== 'running') return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/pipeline/runStep`);

      const newMessage: AgentMessage | null = response.data.message || null;

      setState(prev => ({
        ...prev,
        ...response.data,
        messages: newMessage
          ? [...prev.messages, newMessage]
          : prev.messages,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    } finally {
      setLoading(false);
    }
  }, [state.status]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const stopSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/pipeline/stop`);
      setState(prev => ({
        ...prev,
        ...response.data,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const addMessage = useCallback((message: AgentMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const setStatus = useCallback((status: PipelineStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  return {
    state,
    loading,
    setProjectMode,
    startSession,
    runNextStep,
    stopSession,
    refreshState,
    reset,
    addMessage,
    setStatus,
  };
}

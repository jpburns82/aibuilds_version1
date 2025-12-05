/**
 * useChat Hook
 *
 * Manages ChatGPT ideation conversation state.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { ChatMessage, ChatState } from '../types';

const API_BASE = '/api';

const initialState: ChatState = {
  history: [],
  plan: { phase: 'ideation' },
  readyToBuild: false,
  loading: false,
  error: null,
};

export function useChat() {
  const [state, setState] = useState<ChatState>(initialState);

  const refreshState = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/chat/state`);
      setState(prev => ({
        ...prev,
        history: response.data.history || [],
        plan: response.data.plan || { phase: 'ideation' },
        readyToBuild: response.data.readyToBuild || false,
      }));
    } catch (error) {
      console.error('Failed to refresh chat state:', error);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      history: [...prev.history, userMessage],
    }));

    try {
      const response = await axios.post(`${API_BASE}/chat/message`, { message });

      setState(prev => ({
        ...prev,
        history: response.data.history || prev.history,
        plan: response.data.plan || prev.plan,
        readyToBuild: response.data.readyToBuild || false,
        loading: false,
      }));

      return response.data.response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Chat failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/chat/reset`);
      setState(initialState);
    } catch (error) {
      console.error('Failed to reset chat:', error);
    }
  }, []);

  const triggerBuild = useCallback(async () => {
    if (!state.readyToBuild) {
      throw new Error('Build plan is not ready');
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.post(`${API_BASE}/chat/build`);
      setState(prev => ({ ...prev, loading: false }));
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Build failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [state.readyToBuild]);

  return {
    state,
    sendMessage,
    reset,
    triggerBuild,
    refreshState,
  };
}

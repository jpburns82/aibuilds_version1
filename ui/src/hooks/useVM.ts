/**
 * useVM Hook
 *
 * Manages VM runs and execution results.
 */

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { VMRun } from '../types';

const API_BASE = '/api';

export function useVM() {
  const [runs, setRuns] = useState<VMRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCode = useCallback(async (code: string, language: 'js' | 'ts' = 'js') => {
    setLoading(true);
    setError(null);

    const tempRun: VMRun = {
      id: `temp-${Date.now()}`,
      language,
      code,
      status: 'pending',
      output: '',
      error: null,
      startedAt: new Date(),
      completedAt: null,
    };

    setRuns(prev => [...prev, tempRun]);
    setActiveRunId(tempRun.id);

    try {
      const response = await axios.post(`${API_BASE}/vm/run`, { code, language });

      const completedRun: VMRun = {
        ...tempRun,
        id: response.data.id || tempRun.id,
        status: response.data.error ? 'error' : 'success',
        output: response.data.output || '',
        error: response.data.error || null,
        completedAt: new Date(),
      };

      setRuns(prev =>
        prev.map(r => (r.id === tempRun.id ? completedRun : r))
      );
      setActiveRunId(completedRun.id);

      return completedRun;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'VM execution failed';
      setError(message);

      const failedRun: VMRun = {
        ...tempRun,
        status: 'error',
        error: message,
        completedAt: new Date(),
      };

      setRuns(prev =>
        prev.map(r => (r.id === tempRun.id ? failedRun : r))
      );

      return failedRun;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectRun = useCallback((id: string) => {
    setActiveRunId(id);
  }, []);

  const clearRuns = useCallback(() => {
    setRuns([]);
    setActiveRunId(null);
    setError(null);
  }, []);

  const activeRun = useMemo(() => {
    if (!activeRunId) return null;
    return runs.find(r => r.id === activeRunId) || null;
  }, [runs, activeRunId]);

  const recentRuns = useMemo(() => {
    return [...runs].reverse().slice(0, 10);
  }, [runs]);

  const stats = useMemo(() => {
    return {
      total: runs.length,
      success: runs.filter(r => r.status === 'success').length,
      failed: runs.filter(r => r.status === 'error').length,
      pending: runs.filter(r => r.status === 'pending' || r.status === 'running').length,
    };
  }, [runs]);

  return {
    runs,
    activeRun,
    recentRuns,
    loading,
    error,
    stats,
    runCode,
    selectRun,
    clearRuns,
  };
}

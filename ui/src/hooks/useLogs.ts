/**
 * useLogs Hook
 *
 * Manages application-wide log entries.
 */

import { useState, useCallback, useMemo } from 'react';
import { LogEntry } from '../types';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function useLogs(maxEntries: number = 100) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const addLog = useCallback((
    level: LogLevel,
    source: string,
    message: string
  ) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      level,
      source,
      message,
    };

    setEntries(prev => {
      const updated = [...prev, entry];
      // Keep only the most recent entries
      if (updated.length > maxEntries) {
        return updated.slice(-maxEntries);
      }
      return updated;
    });
  }, [maxEntries]);

  const info = useCallback((source: string, message: string) => {
    addLog('info', source, message);
  }, [addLog]);

  const warn = useCallback((source: string, message: string) => {
    addLog('warn', source, message);
  }, [addLog]);

  const error = useCallback((source: string, message: string) => {
    addLog('error', source, message);
  }, [addLog]);

  const debug = useCallback((source: string, message: string) => {
    addLog('debug', source, message);
  }, [addLog]);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  const filteredByLevel = useCallback((level: LogLevel) => {
    return entries.filter(e => e.level === level);
  }, [entries]);

  const filteredBySource = useCallback((source: string) => {
    return entries.filter(e => e.source === source);
  }, [entries]);

  const recentEntries = useMemo(() => {
    return [...entries].reverse();
  }, [entries]);

  const stats = useMemo(() => ({
    total: entries.length,
    info: entries.filter(e => e.level === 'info').length,
    warnings: entries.filter(e => e.level === 'warn').length,
    errors: entries.filter(e => e.level === 'error').length,
  }), [entries]);

  return {
    entries,
    recentEntries,
    stats,
    addLog,
    info,
    warn,
    error,
    debug,
    clear,
    filteredByLevel,
    filteredBySource,
  };
}

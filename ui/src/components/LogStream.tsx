/**
 * LogStream Component
 *
 * Displays real-time log entries from various sources.
 */

import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { LogEntry } from '../types';
import './LogStream.css';

interface LogStreamProps {
  entries: LogEntry[];
  onClear: () => void;
}

export function LogStream({ entries, onClear }: LogStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="log-stream">
      <div className="log-stream__header">
        <span className="log-stream__title">Logs</span>
        <div className="log-stream__actions">
          <span className="log-stream__count">{entries.length} entries</span>
          <button
            className="log-stream__clear"
            onClick={onClear}
            disabled={entries.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="log-stream__content" ref={scrollRef}>
        {entries.length === 0 ? (
          <div className="log-stream__empty">
            <span>No log entries</span>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={clsx('log-entry', `log-entry--${entry.level}`)}
            >
              <span className="log-entry__time">{formatTime(entry.timestamp)}</span>
              <span className="log-entry__level">{entry.level}</span>
              <span className="log-entry__source">[{entry.source}]</span>
              <span className="log-entry__message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

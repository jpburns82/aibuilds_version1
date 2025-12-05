/**
 * VMConsole Component
 *
 * Displays VM execution results and provides run controls.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { VMRun } from '../types';
import './VMConsole.css';

interface VMConsoleProps {
  activeRun: VMRun | null;
  recentRuns: VMRun[];
  loading: boolean;
  stats: { total: number; success: number; failed: number; pending: number };
  onRunCode: (code: string, language: 'js' | 'ts') => void;
  onSelectRun: (id: string) => void;
}

export function VMConsole({
  activeRun,
  recentRuns,
  loading,
  stats,
  onRunCode,
  onSelectRun,
}: VMConsoleProps) {
  const [code, setCode] = useState('console.log("Hello from VM!");');
  const [language, setLanguage] = useState<'js' | 'ts'>('js');

  const handleRun = () => {
    if (code.trim()) {
      onRunCode(code, language);
    }
  };

  return (
    <div className="vm-console">
      <div className="vm-console__header">
        <span className="vm-console__title">VM Console</span>
        <div className="vm-console__stats">
          <span className="stat stat--success">{stats.success}</span>
          <span className="stat stat--failed">{stats.failed}</span>
          <span className="stat stat--total">{stats.total}</span>
        </div>
      </div>

      <div className="vm-console__input">
        <div className="vm-console__input-header">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'js' | 'ts')}
            className="vm-console__lang-select"
          >
            <option value="js">JavaScript</option>
            <option value="ts">TypeScript</option>
          </select>
          <button
            className="vm-console__run-button"
            onClick={handleRun}
            disabled={loading || !code.trim()}
          >
            {loading ? 'Running...' : 'Run'}
          </button>
        </div>
        <textarea
          className="vm-console__code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code to execute..."
          rows={4}
        />
      </div>

      <div className="vm-console__output">
        {activeRun ? (
          <div className={clsx('vm-run', `vm-run--${activeRun.status}`)}>
            <div className="vm-run__header">
              <span className="vm-run__status">{activeRun.status}</span>
              <span className="vm-run__time">
                {new Date(activeRun.startedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="vm-run__content">
              {activeRun.output && (
                <div className="vm-run__stdout">
                  <span className="vm-run__label">stdout:</span>
                  <pre>{activeRun.output}</pre>
                </div>
              )}
              {activeRun.error && (
                <div className="vm-run__stderr">
                  <span className="vm-run__label">error:</span>
                  <pre>{activeRun.error}</pre>
                </div>
              )}
              {!activeRun.output && !activeRun.error && activeRun.status === 'success' && (
                <span className="vm-run__empty">(no output)</span>
              )}
            </div>
          </div>
        ) : (
          <div className="vm-console__placeholder">
            <span>No VM runs yet</span>
            <small>Execute code above to see results</small>
          </div>
        )}
      </div>

      {recentRuns.length > 1 && (
        <div className="vm-console__history">
          <span className="vm-console__history-label">Recent runs:</span>
          {recentRuns.slice(0, 5).map((run) => (
            <button
              key={run.id}
              className={clsx('vm-console__history-item', {
                'vm-console__history-item--active': run.id === activeRun?.id,
              })}
              onClick={() => onSelectRun(run.id)}
            >
              <span className={`dot dot--${run.status}`} />
              {new Date(run.startedAt).toLocaleTimeString()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

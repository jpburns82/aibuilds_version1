/**
 * AgentStatusBar Component
 *
 * Shows current pipeline status, active agent, and project info.
 */

// React 18+ doesn't require explicit import for JSX
import clsx from 'clsx';
import { AGENT_COLORS, AGENT_LABELS, AgentRole } from '../types';
import './AgentStatusBar.css';

interface AgentStatusBarProps {
  currentAgent: string | null;
  projectName: string | null;
  projectMode: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'status--idle' },
  running: { label: 'Running', className: 'status--running' },
  completed: { label: 'Completed', className: 'status--completed' },
  error: { label: 'Error', className: 'status--error' },
  blocked: { label: 'Blocked by Validation', className: 'status--blocked' },
};

export function AgentStatusBar({
  currentAgent,
  projectName,
  projectMode,
  status,
}: AgentStatusBarProps) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const agentColor = currentAgent
    ? AGENT_COLORS[currentAgent as AgentRole]
    : 'var(--text-secondary)';
  const agentLabel = currentAgent
    ? AGENT_LABELS[currentAgent as AgentRole]
    : 'None';

  return (
    <div className="agent-status-bar">
      <div className="agent-status-bar__section">
        <span className="agent-status-bar__label">Status</span>
        <span className={clsx('agent-status-bar__badge', statusConfig.className)}>
          {statusConfig.label}
        </span>
      </div>

      <div className="agent-status-bar__section">
        <span className="agent-status-bar__label">Current Agent</span>
        <span
          className="agent-status-bar__agent"
          style={{ color: agentColor }}
        >
          {agentLabel}
        </span>
      </div>

      <div className="agent-status-bar__section">
        <span className="agent-status-bar__label">Project</span>
        <span className="agent-status-bar__value">
          {projectName || 'No project'}
        </span>
      </div>

      <div className="agent-status-bar__section">
        <span className="agent-status-bar__label">Mode</span>
        <span className="agent-status-bar__mode">
          {projectMode.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

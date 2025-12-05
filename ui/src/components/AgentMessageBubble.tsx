/**
 * AgentMessageBubble Component
 *
 * Individual message bubble with agent-specific styling.
 */

// React 18+ doesn't require explicit import for JSX
import { AgentMessage, AGENT_COLORS, AGENT_LABELS } from '../types';
import './AgentMessageBubble.css';

interface AgentMessageBubbleProps {
  message: AgentMessage;
}

export function AgentMessageBubble({ message }: AgentMessageBubbleProps) {
  const agentColor = AGENT_COLORS[message.agentRole];
  const agentLabel = AGENT_LABELS[message.agentRole];

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate very long content for display
  const displayContent = message.content.length > 2000
    ? message.content.substring(0, 2000) + '...[truncated]'
    : message.content;

  return (
    <div className="agent-message-bubble">
      <div
        className="agent-message-bubble__header"
        style={{ borderLeftColor: agentColor }}
      >
        <span
          className="agent-message-bubble__agent"
          style={{ color: agentColor }}
        >
          {agentLabel}
        </span>
        <span className="agent-message-bubble__time">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="agent-message-bubble__content">
        <pre>{displayContent}</pre>
      </div>
    </div>
  );
}

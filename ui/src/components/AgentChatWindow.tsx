/**
 * AgentChatWindow Component
 *
 * Displays agent messages in a chat-like interface.
 */

import { useRef, useEffect } from 'react';
import { AgentMessage } from '../types';
import { AgentMessageBubble } from './AgentMessageBubble';
import { AgentStatusBar } from './AgentStatusBar';
import './AgentChatWindow.css';

interface AgentChatWindowProps {
  messages: AgentMessage[];
  currentAgent: string | null;
  projectName: string | null;
  projectMode: string;
  status: string;
}

export function AgentChatWindow({
  messages,
  currentAgent,
  projectName,
  projectMode,
  status,
}: AgentChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="agent-chat-window">
      <AgentStatusBar
        currentAgent={currentAgent}
        projectName={projectName}
        projectMode={projectMode}
        status={status}
      />

      <div className="agent-chat-window__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="agent-chat-window__empty">
            <div className="agent-chat-window__placeholder">
              <span>No messages yet</span>
              <small>Start a session to see agent activity</small>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <AgentMessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  );
}

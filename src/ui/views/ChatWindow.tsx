/**
 * Chat Window Component (SCAFFOLD)
 *
 * UI for user <-> agent communication.
 * Full implementation requires React/Next.js setup (Phase 5+).
 */

import React from 'react';

interface Message {
  role: 'user' | 'agent';
  agentName?: string;
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export function ChatWindow({ messages, onSendMessage }: ChatWindowProps) {
  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <span className="author">{msg.agentName || 'User'}</span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input type="text" placeholder="Message agents..." />
        <button onClick={() => onSendMessage('')}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;

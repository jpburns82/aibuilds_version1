/**
 * IdeationChat Component
 *
 * ChatGPT-powered ideation chat for planning projects before build.
 * This is the Human <-> ChatGPT conversation pane.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, BuildPlanPacket } from '../types';
import './IdeationChat.css';

interface IdeationChatProps {
  messages: ChatMessage[];
  plan: BuildPlanPacket;
  readyToBuild: boolean;
  loading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onTriggerBuild: () => void;
  onReset: () => void;
}

export function IdeationChat({
  messages,
  plan,
  readyToBuild,
  loading,
  error,
  onSendMessage,
  onTriggerBuild,
  onReset,
}: IdeationChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="ideation-chat">
      <div className="ideation-chat__header">
        <div className="ideation-chat__title">
          <span className="ideation-chat__icon">GPT</span>
          <span>ChatGPT Architect</span>
        </div>
        <div className="ideation-chat__actions">
          {plan.phase && (
            <span className={`ideation-chat__phase ideation-chat__phase--${plan.phase}`}>
              {plan.phase === 'ready-to-build' ? 'Ready to Build' : plan.phase}
            </span>
          )}
          <button
            className="ideation-chat__reset-btn"
            onClick={onReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="ideation-chat__messages">
        {messages.length === 0 && (
          <div className="ideation-chat__welcome">
            <h3>Welcome to AI-Builds</h3>
            <p>I'm your Lead Architect. Tell me what you'd like to build, and I'll help you plan it.</p>
            <ul>
              <li>Describe your project idea</li>
              <li>I'll ask clarifying questions</li>
              <li>We'll define features and tech stack</li>
              <li>Then I'll send it to the build team</li>
            </ul>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`ideation-chat__message ideation-chat__message--${msg.role}`}>
            <div className="ideation-chat__message-header">
              <span className="ideation-chat__message-role">
                {msg.role === 'user' ? 'You' : 'ChatGPT Architect'}
              </span>
              <span className="ideation-chat__message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="ideation-chat__message-content">
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ideation-chat__message ideation-chat__message--assistant">
            <div className="ideation-chat__typing">Thinking...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="ideation-chat__error">{error}</div>
      )}

      {readyToBuild && (
        <div className="ideation-chat__build-ready">
          <div className="ideation-chat__plan-summary">
            <strong>Build Plan Ready</strong>
            <p>Project: {plan.projectName}</p>
            <p>Mode: {plan.strictnessMode}</p>
          </div>
          <button
            className="ideation-chat__build-btn"
            onClick={onTriggerBuild}
            disabled={loading}
          >
            Send to Build Team
          </button>
        </div>
      )}

      <form className="ideation-chat__input-form" onSubmit={handleSubmit}>
        <textarea
          className="ideation-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your project idea..."
          disabled={loading}
          rows={2}
        />
        <button
          type="submit"
          className="ideation-chat__send-btn"
          disabled={!input.trim() || loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

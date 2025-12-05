/**
 * Toolbar Component
 *
 * Top toolbar with project prompt, mode selector, and controls.
 */

import React, { useState } from 'react';
import { ProjectMode } from '../types';
import { StrictnessSelector } from './StrictnessSelector';
import './Toolbar.css';

interface ToolbarProps {
  projectMode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  onStartSession: (prompt: string, mode: ProjectMode) => void;
  onRunNextStep: () => void;
  onStop: () => void;
  isRunning: boolean;
  isBlocked: boolean;
  canRunStep: boolean;
  loading: boolean;
}

export function Toolbar({
  projectMode,
  onModeChange,
  onStartSession,
  onRunNextStep,
  onStop,
  isRunning,
  isBlocked,
  canRunStep,
  loading,
}: ToolbarProps) {
  const [prompt, setPrompt] = useState('');

  const handleStart = () => {
    if (prompt.trim()) {
      onStartSession(prompt.trim(), projectMode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim() && !loading) {
      handleStart();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <div className="toolbar__logo">
          <span className="toolbar__logo-icon">AI</span>
          <span className="toolbar__logo-text">Builds Workbench</span>
        </div>
      </div>

      <div className="toolbar__center">
        <input
          type="text"
          className="toolbar__input"
          placeholder="Enter your project prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning || loading}
        />
      </div>

      <div className="toolbar__right">
        <StrictnessSelector
          value={projectMode}
          onChange={onModeChange}
          disabled={isRunning || loading}
        />

        <button
          className="toolbar__button toolbar__button--primary"
          onClick={handleStart}
          disabled={!prompt.trim() || isRunning || loading}
        >
          {loading ? 'Starting...' : 'Start Session'}
        </button>

        <button
          className="toolbar__button toolbar__button--secondary"
          onClick={onRunNextStep}
          disabled={!canRunStep || loading}
        >
          Run Next Step
        </button>

        {(isRunning || isBlocked) && (
          <button
            className="toolbar__button toolbar__button--danger"
            onClick={onStop}
          >
            {isBlocked ? 'Reset' : 'Stop'}
          </button>
        )}
      </div>
    </div>
  );
}

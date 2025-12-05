/**
 * Strictness Selector UI Component
 *
 * Allows users to select project strictness mode:
 * - Prototype (400 lines, loose rules)
 * - MVP (300 lines, strict rules)
 * - Production (300 lines, maximum validation)
 *
 * NOTE: This is a scaffold/stub. Full React implementation requires
 * Next.js/React setup which is not configured in this Phase.
 */

import React, { useState } from 'react';
import { ProjectMode, ALL_PROFILES } from '../../blueprint/StrictnessProfiles';

/**
 * Strictness Selector Props
 */
interface StrictnessSelectorProps {
  currentMode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  disabled?: boolean;
}

/**
 * Strictness Selector Component
 */
export function StrictnessSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: StrictnessSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ProjectMode>(currentMode);

  const handleChange = (mode: ProjectMode) => {
    setSelectedMode(mode);
    onModeChange(mode);
  };

  return (
    <div className="strictness-selector">
      <h3>Project Strictness Mode</h3>
      <div className="mode-options">
        {ALL_PROFILES.map((profile) => (
          <div
            key={profile.mode}
            className={`mode-option ${
              selectedMode === profile.mode ? 'selected' : ''
            } ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && handleChange(profile.mode)}
          >
            <div className="mode-header">
              <span className="mode-name">{profile.mode.toUpperCase()}</span>
              <span className="mode-limit">{profile.maxLinesPerFile} lines max</span>
            </div>
            <p className="mode-description">{profile.description}</p>
            <div className="mode-features">
              <span className="feature">
                {profile.structureRequired ? '✓' : '✗'} Required Structure
              </span>
              <span className="feature">
                {profile.detectCircularDeps ? '✓' : '✗'} Circular Dep Detection
              </span>
              <span className="feature">
                {profile.requireTestCoverage ? '✓' : '✗'} Test Coverage
              </span>
              <span className="feature">
                {profile.securityLinting ? '✓' : '✗'} Security Linting
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="strictness-warning">
        ⚠️ Switching from Prototype → MVP or MVP → Production will:
        <ul>
          <li>Re-run all validators immediately</li>
          <li>Block code generation until violations are fixed</li>
          <li>Enforce stricter rules on all components</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Strictness Badge Component (for display in other UIs)
 */
interface StrictnessBadgeProps {
  mode: ProjectMode;
  size?: 'small' | 'medium' | 'large';
}

export function StrictnessBadge({ mode, size = 'medium' }: StrictnessBadgeProps) {
  const colors = {
    prototype: '#f59e0b',
    mvp: '#3b82f6',
    production: '#10b981',
  };

  return (
    <span
      className={`strictness-badge ${size}`}
      style={{ backgroundColor: colors[mode] }}
    >
      {mode.toUpperCase()}
    </span>
  );
}

/**
 * Export both components
 */
export default StrictnessSelector;

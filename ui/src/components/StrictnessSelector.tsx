/**
 * StrictnessSelector Component
 *
 * Dropdown for selecting project strictness mode.
 */

// React 18+ doesn't require explicit import for JSX
import { ProjectMode } from '../types';
import './StrictnessSelector.css';

interface StrictnessSelectorProps {
  value: ProjectMode;
  onChange: (mode: ProjectMode) => void;
  disabled?: boolean;
}

const MODE_INFO: Record<ProjectMode, { label: string; description: string; color: string }> = {
  prototype: {
    label: 'Prototype',
    description: '400 lines, loose validation',
    color: 'var(--accent-green)',
  },
  mvp: {
    label: 'MVP',
    description: '300 lines, strict validation',
    color: 'var(--accent-orange)',
  },
  production: {
    label: 'Production',
    description: '300 lines, maximum validation',
    color: 'var(--accent-red)',
  },
};

export function StrictnessSelector({
  value,
  onChange,
  disabled = false,
}: StrictnessSelectorProps) {
  const currentMode = MODE_INFO[value];

  return (
    <div className="strictness-selector">
      <label className="strictness-selector__label">Mode:</label>
      <select
        className="strictness-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectMode)}
        disabled={disabled}
        style={{ borderColor: currentMode.color }}
      >
        {Object.entries(MODE_INFO).map(([mode, info]) => (
          <option key={mode} value={mode}>
            {info.label}
          </option>
        ))}
      </select>
      <span
        className="strictness-selector__indicator"
        style={{ backgroundColor: currentMode.color }}
        title={currentMode.description}
      />
    </div>
  );
}

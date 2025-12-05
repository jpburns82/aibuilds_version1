/**
 * ValidationPanel Component
 *
 * Displays validation report with violations grouped by severity.
 */

// React 18+ doesn't require explicit import for JSX
import clsx from 'clsx';
import { ValidationReport, ValidationViolation } from '../types';
import './ValidationPanel.css';

interface ValidationPanelProps {
  report: ValidationReport | null;
  loading?: boolean;
  onFileClick?: (path: string) => void;
}

interface ViolationRowProps {
  violation: ValidationViolation;
  onFileClick?: (path: string) => void;
}

function ViolationRow({ violation, onFileClick }: ViolationRowProps) {
  const handleFileClick = () => {
    if (violation.file && onFileClick) {
      onFileClick(violation.file);
    }
  };

  return (
    <div className={clsx('violation-row', `violation-row--${violation.severity}`)}>
      <span className="violation-row__severity">{violation.severity}</span>
      <span className="violation-row__type">{violation.type}</span>
      <span className="violation-row__message">{violation.message}</span>
      {violation.file && (
        <button
          className="violation-row__file"
          onClick={handleFileClick}
          title={violation.file}
        >
          {violation.file.split('/').pop()}
        </button>
      )}
    </div>
  );
}

export function ValidationPanel({
  report,
  loading = false,
  onFileClick,
}: ValidationPanelProps) {
  if (loading) {
    return (
      <div className="validation-panel validation-panel--loading">
        <span>Loading validation report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="validation-panel validation-panel--empty">
        <div className="validation-panel__placeholder">
          <span>No validation report</span>
          <small>Run the pipeline to see validation results</small>
        </div>
      </div>
    );
  }

  const allViolations = [...report.violations, ...report.warnings, ...report.info];

  return (
    <div className="validation-panel">
      <div className="validation-panel__summary">
        <div className={clsx('validation-panel__status', {
          'validation-panel__status--valid': report.valid,
          'validation-panel__status--invalid': !report.valid,
        })}>
          {report.valid ? 'VALID' : 'INVALID'}
        </div>
        <div className="validation-panel__counts">
          <span className="count count--critical">{report.summary.critical} Critical</span>
          <span className="count count--error">{report.summary.errors} Errors</span>
          <span className="count count--warning">{report.summary.warnings} Warnings</span>
          <span className="count count--info">{report.summary.info} Info</span>
        </div>
      </div>

      <div className="validation-panel__violations">
        {allViolations.length === 0 ? (
          <div className="validation-panel__no-violations">
            No violations found
          </div>
        ) : (
          allViolations.map((violation, index) => (
            <ViolationRow
              key={`${violation.type}-${index}`}
              violation={violation}
              onFileClick={onFileClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * useValidation Hook
 *
 * Manages validation report fetching and formatting.
 */

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ValidationReport, ValidationViolation } from '../types';

const API_BASE = '/api';

export function useValidation() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/validation/report`);
      setReport(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load validation report';
      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  // Get all violations sorted by severity
  const sortedViolations = useMemo((): ValidationViolation[] => {
    if (!report) return [];

    const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };

    return [...report.violations, ...report.warnings, ...report.info].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }, [report]);

  // Group violations by file
  const violationsByFile = useMemo((): Map<string, ValidationViolation[]> => {
    const byFile = new Map<string, ValidationViolation[]>();

    for (const violation of sortedViolations) {
      const file = violation.file || '(general)';
      const existing = byFile.get(file) || [];
      byFile.set(file, [...existing, violation]);
    }

    return byFile;
  }, [sortedViolations]);

  // Summary stats
  const stats = useMemo(() => {
    if (!report) {
      return { total: 0, critical: 0, errors: 0, warnings: 0, info: 0, isValid: true };
    }

    return {
      total: report.summary.totalViolations,
      critical: report.summary.critical,
      errors: report.summary.errors,
      warnings: report.summary.warnings,
      info: report.summary.info,
      isValid: report.valid,
    };
  }, [report]);

  return {
    report,
    loading,
    error,
    fetchReport,
    clearReport,
    sortedViolations,
    violationsByFile,
    stats,
  };
}

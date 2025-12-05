/**
 * Strictness Profiles for Blueprint Enforcement
 *
 * Defines validation behavior based on project mode:
 * - Prototype: Loose validation, fast iteration
 * - MVP: Strict validation, production-ready structure
 * - Production: Maximum validation, enterprise-grade
 */

export type ProjectMode = 'prototype' | 'mvp' | 'production';

export interface StrictnessProfile {
  mode: ProjectMode;
  maxLinesPerFile: number;
  structureRequired: boolean;
  allowExtraFiles: boolean;
  allowMissingFiles: boolean;
  requireExactImports: boolean;
  detectCircularDeps: boolean;
  enforceLayering: boolean;
  requireTestCoverage: boolean;
  securityLinting: boolean;
  robloxValidation: 'off' | 'warnings' | 'strict';
  naming: 'loose' | 'moderate' | 'strict';
  description: string;
}

/**
 * Prototype Mode - Fast Iteration
 *
 * For rapid prototyping and experimentation.
 * Relaxed rules to allow quick exploration.
 */
export const PROTOTYPE_PROFILE: StrictnessProfile = {
  mode: 'prototype',
  maxLinesPerFile: 400,
  structureRequired: false,
  allowExtraFiles: true,
  allowMissingFiles: true,
  requireExactImports: false,
  detectCircularDeps: false,
  enforceLayering: false,
  requireTestCoverage: false,
  securityLinting: false,
  robloxValidation: 'warnings',
  naming: 'loose',
  description: 'Loose validation for rapid prototyping. 400 line limit, optional structure.',
};

/**
 * MVP Mode - Production Ready
 *
 * For minimum viable products ready for users.
 * Strict rules to ensure clean, maintainable code.
 */
export const MVP_PROFILE: StrictnessProfile = {
  mode: 'mvp',
  maxLinesPerFile: 300,
  structureRequired: true,
  allowExtraFiles: false,
  allowMissingFiles: false,
  requireExactImports: true,
  detectCircularDeps: true,
  enforceLayering: false,
  requireTestCoverage: false,
  securityLinting: true,
  robloxValidation: 'strict',
  naming: 'moderate',
  description: 'Strict validation for MVP. 300 line limit, exact structure required.',
};

/**
 * Production Mode - Enterprise Grade
 *
 * For production systems requiring maximum quality.
 * Maximum validation including security and testing.
 */
export const PRODUCTION_PROFILE: StrictnessProfile = {
  mode: 'production',
  maxLinesPerFile: 300,
  structureRequired: true,
  allowExtraFiles: false,
  allowMissingFiles: false,
  requireExactImports: true,
  detectCircularDeps: true,
  enforceLayering: true,
  requireTestCoverage: true,
  securityLinting: true,
  robloxValidation: 'strict',
  naming: 'strict',
  description: 'Maximum validation for production. All rules enforced.',
};

/**
 * Profile Registry
 */
export const STRICTNESS_PROFILES: Record<ProjectMode, StrictnessProfile> = {
  prototype: PROTOTYPE_PROFILE,
  mvp: MVP_PROFILE,
  production: PRODUCTION_PROFILE,
};

/**
 * Get strictness profile by mode
 */
export function getStrictnessProfile(mode: ProjectMode): StrictnessProfile {
  return STRICTNESS_PROFILES[mode];
}

/**
 * Determine if a profile is stricter than another
 */
export function isStricterThan(mode1: ProjectMode, mode2: ProjectMode): boolean {
  const order: ProjectMode[] = ['prototype', 'mvp', 'production'];
  return order.indexOf(mode1) > order.indexOf(mode2);
}

/**
 * Get the strictest mode from a list
 */
export function getStrictestMode(modes: ProjectMode[]): ProjectMode {
  if (modes.includes('production')) return 'production';
  if (modes.includes('mvp')) return 'mvp';
  return 'prototype';
}

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Get validation severity based on strictness
 */
export function getSeverityForViolation(
  violationType: string,
  profile: StrictnessProfile
): ValidationSeverity {
  // Critical violations (always error in MVP+)
  const criticalViolations = [
    'missing_required_file',
    'circular_dependency',
    'security_issue',
  ];

  if (criticalViolations.includes(violationType)) {
    return profile.mode === 'prototype' ? 'warning' : 'error';
  }

  // Structural violations
  const structuralViolations = [
    'extra_file',
    'wrong_folder',
    'naming_violation',
  ];

  if (structuralViolations.includes(violationType)) {
    if (profile.mode === 'prototype') return 'info';
    if (profile.mode === 'mvp') return 'warning';
    return 'error';
  }

  // Line count violations
  if (violationType === 'line_count_exceeded') {
    if (profile.mode === 'prototype') return 'warning';
    return 'error';
  }

  // Default severity
  return profile.mode === 'prototype' ? 'info' : 'warning';
}

/**
 * Check if a violation should block scaffolding
 */
export function shouldBlockScaffolding(
  severity: ValidationSeverity,
  profile: StrictnessProfile
): boolean {
  if (profile.mode === 'prototype') {
    // Prototype only blocks on critical errors
    return severity === 'critical';
  }

  // MVP and Production block on errors and critical
  return severity === 'error' || severity === 'critical';
}

/**
 * Format strictness profile for display
 */
export function formatProfile(profile: StrictnessProfile): string {
  return `${profile.mode.toUpperCase()} Mode - ${profile.description}`;
}

/**
 * Export all profiles for UI consumption
 */
export const ALL_PROFILES = [
  PROTOTYPE_PROFILE,
  MVP_PROFILE,
  PRODUCTION_PROFILE,
];

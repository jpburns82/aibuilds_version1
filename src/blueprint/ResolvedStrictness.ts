/**
 * Resolved Strictness for Hybrid Projects
 *
 * Handles projects where different components have different strictness levels.
 * Uses max(componentStrictness) rule - the project adopts the strictest profile
 * of any component.
 *
 * Example:
 * - Component A: prototype
 * - Component B: mvp
 * - Result: Project uses MVP strictness
 */

import {
  ProjectMode,
  StrictnessProfile,
  getStrictnessProfile,
  getStrictestMode,
  isStricterThan,
} from './StrictnessProfiles';

/**
 * Component strictness declaration
 */
export interface ComponentStrictness {
  componentName: string;
  componentPath: string;
  mode: ProjectMode;
  reason?: string;
}

/**
 * Resolved strictness for the entire project
 */
export interface ResolvedStrictnessResult {
  resolvedMode: ProjectMode;
  resolvedProfile: StrictnessProfile;
  components: ComponentStrictness[];
  strictestComponent: string;
  upgradedFrom?: ProjectMode;
  reason: string;
}

/**
 * Resolve strictness for a hybrid project
 *
 * Takes multiple component strictness declarations and resolves
 * to a single strictness profile using max(componentStrictness).
 */
export function resolveStrictness(
  components: ComponentStrictness[]
): ResolvedStrictnessResult {
  if (components.length === 0) {
    throw new Error('Cannot resolve strictness: No components provided');
  }

  // If only one component, use its strictness
  if (components.length === 1) {
    const mode = components[0].mode;
    return {
      resolvedMode: mode,
      resolvedProfile: getStrictnessProfile(mode),
      components,
      strictestComponent: components[0].componentName,
      reason: `Single component project using ${mode} mode`,
    };
  }

  // Find strictest mode among all components
  const modes = components.map((c) => c.mode);
  const resolvedMode = getStrictestMode(modes);

  // Find which component caused the strictest mode
  const strictestComponent = components.find((c) => c.mode === resolvedMode)!;

  // Check if any component was upgraded
  const lowestMode = modes.reduce((lowest, current) =>
    isStricterThan(lowest, current) ? current : lowest
  );

  const upgradedFrom = lowestMode !== resolvedMode ? lowestMode : undefined;

  return {
    resolvedMode,
    resolvedProfile: getStrictnessProfile(resolvedMode),
    components,
    strictestComponent: strictestComponent.componentName,
    upgradedFrom,
    reason: upgradedFrom
      ? `Upgraded from ${upgradedFrom} to ${resolvedMode} due to ${strictestComponent.componentName}`
      : `All components use ${resolvedMode} mode`,
  };
}

/**
 * Check if a component's strictness would upgrade the project
 */
export function wouldUpgradeProject(
  currentMode: ProjectMode,
  newComponentMode: ProjectMode
): boolean {
  return isStricterThan(newComponentMode, currentMode);
}

/**
 * Get upgrade warnings when adding a stricter component
 */
export function getUpgradeWarnings(
  from: ProjectMode,
  to: ProjectMode
): string[] {
  if (!isStricterThan(to, from)) {
    return [];
  }

  const warnings: string[] = [];

  warnings.push(
    `Project strictness will be upgraded from ${from} to ${to}`
  );

  if (from === 'prototype' && to === 'mvp') {
    warnings.push('Line limit will decrease from 400 to 300 lines per file');
    warnings.push('Folder structure will become required');
    warnings.push('Extra files will no longer be allowed');
    warnings.push('Roblox validation will become strict');
  }

  if (from === 'prototype' && to === 'production') {
    warnings.push('Line limit will decrease from 400 to 300 lines per file');
    warnings.push('Folder structure will become required');
    warnings.push('Test coverage will be required');
    warnings.push('Security linting will be enabled');
    warnings.push('Layering rules will be enforced');
  }

  if (from === 'mvp' && to === 'production') {
    warnings.push('Test coverage will be required');
    warnings.push('Layering rules will be enforced');
  }

  return warnings;
}

/**
 * Simulate strictness resolution before actually applying
 */
export function simulateStrictnessResolution(
  existing: ComponentStrictness[],
  newComponent: ComponentStrictness
): ResolvedStrictnessResult {
  return resolveStrictness([...existing, newComponent]);
}

/**
 * Validate that all components can coexist under resolved strictness
 */
export function validateComponentCompatibility(
  components: ComponentStrictness[]
): {
  compatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if any prototype components would violate MVP/Production rules
  const resolved = resolveStrictness(components);

  if (resolved.resolvedMode !== 'prototype') {
    const prototypeComponents = components.filter(
      (c) => c.mode === 'prototype'
    );

    for (const component of prototypeComponents) {
      issues.push(
        `Component "${component.componentName}" is marked as prototype but project uses ${resolved.resolvedMode} mode`
      );
      issues.push(
        `  → This component must adhere to ${resolved.resolvedMode} strictness rules`
      );
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}

/**
 * Format resolved strictness for display
 */
export function formatResolved(result: ResolvedStrictnessResult): string {
  const lines: string[] = [];

  lines.push(`Resolved Strictness: ${result.resolvedMode.toUpperCase()}`);
  lines.push(`Reason: ${result.reason}`);

  if (result.upgradedFrom) {
    lines.push(`Upgraded from: ${result.upgradedFrom}`);
    lines.push(`Strictest component: ${result.strictestComponent}`);
  }

  lines.push(`\nComponents:`);
  for (const component of result.components) {
    const marker =
      component.componentName === result.strictestComponent ? '→' : ' ';
    lines.push(
      `${marker} ${component.componentName}: ${component.mode}${
        component.reason ? ` (${component.reason})` : ''
      }`
    );
  }

  return lines.join('\n');
}

/**
 * Create component strictness declaration
 */
export function createComponentStrictness(
  name: string,
  path: string,
  mode: ProjectMode,
  reason?: string
): ComponentStrictness {
  return {
    componentName: name,
    componentPath: path,
    mode,
    reason,
  };
}

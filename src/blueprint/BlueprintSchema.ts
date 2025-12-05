/**
 * Blueprint Schema Definitions
 *
 * Defines the structure of architectural blueprints that govern
 * code generation and validation in the AI Engineering Team system.
 */

import { ProjectMode } from './StrictnessProfiles';

/**
 * Folder tree node representing project structure
 */
export interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  required: boolean;
  children?: FolderNode[];
  maxLines?: number;
  fileType?: string;
  description?: string;
}

/**
 * Dependency rules for import validation
 */
export interface DependencyRules {
  allowedImports: string[];
  forbiddenImports: string[];
  allowedDependencies?: string[];
  forbiddenDependencies?: string[];
  allowRelativeImports?: boolean;
  allowCrossFolderImports?: boolean;
}

/**
 * Roblox-specific rules
 */
export interface RobloxRules {
  requiresClientFolder: boolean;
  requiresServerFolder: boolean;
  requiresSharedFolder: boolean;
  moduleSuffix: string;
  rojoMappingValidation: 'off' | 'warning' | 'strict';
  forbidServerInClient: boolean;
  requireModuleScript: boolean;
  luauStrictMode?: boolean;
}

/**
 * Naming convention rules
 */
export interface NamingRules {
  fileNaming: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case' | 'any';
  folderNaming: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case' | 'any';
  variableNaming?: 'camelCase' | 'PascalCase' | 'snake_case' | 'any';
  constantNaming?: 'SCREAMING_SNAKE_CASE' | 'PascalCase' | 'any';
  componentNaming?: 'PascalCase' | 'any';
}

/**
 * Testing rules
 */
export interface TestingRules {
  requireTests: boolean;
  minCoverage?: number;
  testFilePattern?: string;
  testLocation?: 'alongside' | 'separate';
}

/**
 * Security rules
 */
export interface SecurityRules {
  forbidEval: boolean;
  forbidDangerousAPIs: boolean;
  requireInputValidation: boolean;
  scanForSecrets: boolean;
}

/**
 * Layering rules for architecture
 */
export interface LayeringRules {
  layers: string[];
  allowedDependencies: Record<string, string[]>;
  forbidCyclicDependencies: boolean;
}

/**
 * Complete Blueprint Schema
 */
export interface Blueprint {
  // Metadata
  projectName: string;
  projectMode: ProjectMode;
  strictnessProfile: string;
  version: string;
  generatedAt: Date;
  generatedBy: string;

  // Structure
  folderTree: FolderNode;
  requiredFiles: string[];
  optionalFiles?: string[];
  forbiddenFiles?: string[];

  // Constraints
  maxLinesPerFile: number;
  maxFilesPerFolder?: number;
  maxFolderDepth?: number;

  // Rules
  dependencyRules: DependencyRules;
  robloxRules?: RobloxRules;
  namingRules: NamingRules;
  testingRules?: TestingRules;
  securityRules?: SecurityRules;
  layeringRules?: LayeringRules;

  // Metadata
  description?: string;
  tags?: string[];
  author?: string;
}

/**
 * Validation result for blueprint compliance
 */
export interface ValidationViolation {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

/**
 * Blueprint validation report
 */
export interface BlueprintValidationReport {
  valid: boolean;
  violations: ValidationViolation[];
  warnings: ValidationViolation[];
  info: ValidationViolation[];
  summary: {
    totalViolations: number;
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
  testedAt: Date;
  profile: string;
}

/**
 * Create default blueprint
 */
export function createDefaultBlueprint(
  projectName: string,
  mode: ProjectMode
): Blueprint {
  return {
    projectName,
    projectMode: mode,
    strictnessProfile: mode,
    version: '1.0.0',
    generatedAt: new Date(),
    generatedBy: 'ArchitectAgent',
    folderTree: {
      name: projectName,
      type: 'folder',
      path: '/',
      required: true,
      children: [],
    },
    requiredFiles: [],
    maxLinesPerFile: mode === 'prototype' ? 400 : 300,
    dependencyRules: {
      allowedImports: [],
      forbiddenImports: [],
      allowRelativeImports: true,
      allowCrossFolderImports: true,
    },
    namingRules: {
      fileNaming: mode === 'prototype' ? 'any' : 'camelCase',
      folderNaming: mode === 'prototype' ? 'any' : 'kebab-case',
    },
  };
}

/**
 * Create validation report
 */
export function createValidationReport(
  violations: ValidationViolation[],
  profile: string
): BlueprintValidationReport {
  const critical = violations.filter((v) => v.severity === 'critical');
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');
  const info = violations.filter((v) => v.severity === 'info');

  return {
    valid: critical.length === 0 && errors.length === 0,
    violations: [...critical, ...errors],
    warnings,
    info,
    summary: {
      totalViolations: violations.length,
      critical: critical.length,
      errors: errors.length,
      warnings: warnings.length,
      info: info.length,
    },
    testedAt: new Date(),
    profile,
  };
}

/**
 * Serialize blueprint to JSON
 */
export function serializeBlueprint(blueprint: Blueprint): string {
  return JSON.stringify(blueprint, null, 2);
}

/**
 * Parse blueprint from JSON
 */
export function parseBlueprint(json: string): Blueprint {
  const parsed = JSON.parse(json);
  // Convert date strings back to Date objects
  parsed.generatedAt = new Date(parsed.generatedAt);
  return parsed;
}

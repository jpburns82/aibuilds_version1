/**
 * Blueprint Validator
 *
 * Validates generated code against architectural blueprints.
 * Enforces file count, folder structure, naming conventions, and line limits.
 */

import {
  Blueprint,
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import {
  getSeverityForViolation,
} from '../blueprint/StrictnessProfiles';
import {
  extractFoldersFromTree,
  extractFilesFromTree,
} from '../blueprint/BlueprintTreeBuilder';
import {
  FileEntry,
  matchesNamingPattern,
  isAllowedExtra,
  scanFileSystem,
} from './ValidationHelpers';

/**
 * BlueprintValidator class
 */
export class BlueprintValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate project against blueprint
   */
  async validate(blueprint: Blueprint): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];

    // Scan actual file system
    const actualFiles = await scanFileSystem(this.projectRoot);

    // Validate folder structure
    violations.push(...this.validateFolderStructure(blueprint, actualFiles));

    // Validate required files
    violations.push(...this.validateRequiredFiles(blueprint, actualFiles));

    // Validate extra files
    violations.push(...this.validateExtraFiles(blueprint, actualFiles));

    // Validate line counts
    violations.push(...this.validateLineCounts(blueprint, actualFiles));

    // Validate naming conventions
    violations.push(...this.validateNaming(blueprint, actualFiles));

    // Create report
    return createValidationReport(violations, blueprint.strictnessProfile);
  }

  /**
   * Validate folder structure matches blueprint
   */
  private validateFolderStructure(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const expectedFolders = extractFoldersFromTree(blueprint.folderTree);
    const actualFolders = actualFiles.filter((f) => f.type === 'folder');

    for (const expectedFolder of expectedFolders) {
      const exists = actualFolders.some((f) => f.path === expectedFolder.path);

      if (!exists && expectedFolder.required) {
        const profile = blueprint.strictnessProfile || 'mvp';
        violations.push({
          type: 'missing_required_folder',
          severity: getSeverityForViolation('missing_required_file', {
            mode: profile as any,
          } as any),
          message: `Required folder missing: ${expectedFolder.path}`,
          suggestion: `Create folder: mkdir -p ${expectedFolder.path}`,
        });
      }
    }

    return violations;
  }

  /**
   * Validate required files exist
   */
  private validateRequiredFiles(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const actualFilePaths = actualFiles
      .filter((f) => f.type === 'file')
      .map((f) => f.path);

    for (const requiredFile of blueprint.requiredFiles) {
      if (!actualFilePaths.includes(requiredFile)) {
        const profile = blueprint.strictnessProfile || 'mvp';
        violations.push({
          type: 'missing_required_file',
          severity: getSeverityForViolation('missing_required_file', {
            mode: profile as any,
          } as any),
          message: `Required file missing: ${requiredFile}`,
          file: requiredFile,
          suggestion: 'Create this file as specified in the blueprint',
        });
      }
    }

    return violations;
  }

  /**
   * Validate no extra files exist (if strict mode)
   */
  private validateExtraFiles(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const profile = blueprint.strictnessProfile || 'mvp';

    // Skip if extra files are allowed
    if (profile === 'prototype') {
      return violations;
    }

    const expectedFiles = extractFilesFromTree(blueprint.folderTree);
    const actualFilePaths = actualFiles
      .filter((f) => f.type === 'file')
      .map((f) => f.path);

    for (const actualPath of actualFilePaths) {
      const isExpected = expectedFiles.some((f) => f.path === actualPath);
      const isForbidden = blueprint.forbiddenFiles?.includes(actualPath);

      if (!isExpected && !isAllowedExtra(actualPath)) {
        violations.push({
          type: 'extra_file',
          severity: getSeverityForViolation('extra_file', {
            mode: profile as any,
          } as any),
          message: `Unexpected file: ${actualPath}`,
          file: actualPath,
          suggestion: 'Remove this file or add it to the blueprint',
        });
      }

      if (isForbidden) {
        violations.push({
          type: 'forbidden_file',
          severity: 'error',
          message: `Forbidden file exists: ${actualPath}`,
          file: actualPath,
          suggestion: 'Remove this file immediately',
        });
      }
    }

    return violations;
  }

  /**
   * Validate line counts
   */
  private validateLineCounts(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const maxLines = blueprint.maxLinesPerFile;

    for (const file of actualFiles) {
      if (file.type === 'file' && file.lines !== undefined) {
        if (file.lines > maxLines) {
          const profile = blueprint.strictnessProfile || 'mvp';
          violations.push({
            type: 'line_count_exceeded',
            severity: getSeverityForViolation('line_count_exceeded', {
              mode: profile as any,
            } as any),
            message: `File exceeds ${maxLines} line limit: ${file.path} (${file.lines} lines)`,
            file: file.path,
            suggestion: `Refactor into helper modules to reduce file size`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate naming conventions
   */
  private validateNaming(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const namingRules = blueprint.namingRules;

    if (namingRules.fileNaming === 'any' && namingRules.folderNaming === 'any') {
      return violations; // Skip if no naming rules
    }

    for (const entry of actualFiles) {
      const expectedPattern =
        entry.type === 'file'
          ? namingRules.fileNaming
          : namingRules.folderNaming;

      if (
        expectedPattern !== 'any' &&
        !matchesNamingPattern(entry.name, expectedPattern)
      ) {
        const profile = blueprint.strictnessProfile || 'mvp';
        violations.push({
          type: 'naming_violation',
          severity: getSeverityForViolation('naming_violation', {
            mode: profile as any,
          } as any),
          message: `${entry.type} name doesn't match ${expectedPattern}: ${entry.name}`,
          file: entry.path,
          suggestion: `Rename to follow ${expectedPattern} convention`,
        });
      }
    }

    return violations;
  }
}

/**
 * Singleton instance
 */
export const blueprintValidator = new BlueprintValidator();

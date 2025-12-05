/**
 * Structure Validator
 *
 * Validates project structure against blueprint:
 * - Folder organization
 * - File placement rules
 * - Naming convention enforcement
 * - Required structure compliance
 */

import {
  Blueprint,
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import { getSeverityForViolation } from '../blueprint/StrictnessProfiles';
import { extractFoldersFromTree, extractFilesFromTree } from '../blueprint/BlueprintTreeBuilder';
import { FileEntry, scanFileSystem } from './ValidationHelpers';

/**
 * Structure Validator
 */
export class StructureValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate project structure
   */
  async validate(blueprint: Blueprint): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];
    const actualFiles = await scanFileSystem(this.projectRoot);

    // Validate folder organization
    violations.push(...this.validateFolderOrganization(blueprint, actualFiles));

    // Validate file placement
    violations.push(...this.validateFilePlacement(blueprint, actualFiles));

    // Validate folder depth
    if (blueprint.maxFolderDepth) {
      violations.push(...this.validateFolderDepth(blueprint, actualFiles));
    }

    // Validate files per folder
    if (blueprint.maxFilesPerFolder) {
      violations.push(...this.validateFilesPerFolder(blueprint, actualFiles));
    }

    return createValidationReport(violations, blueprint.strictnessProfile);
  }

  /**
   * Validate folder organization matches blueprint
   */
  private validateFolderOrganization(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Skip if structure not required
    if (!blueprint.strictnessProfile || blueprint.strictnessProfile === 'prototype') {
      return violations;
    }

    const expectedFolders = extractFoldersFromTree(blueprint.folderTree);
    const actualFolders = actualFiles.filter((f) => f.type === 'folder');

    // Check for missing required folders
    for (const expected of expectedFolders) {
      if (!expected.required) continue;

      const exists = actualFolders.some((actual) =>
        this.pathsMatch(actual.path, expected.path)
      );

      if (!exists) {
        violations.push({
          type: 'missing_required_folder',
          severity: getSeverityForViolation('missing_required_file', {
            mode: blueprint.strictnessProfile as any,
          } as any),
          message: `Required folder missing: ${expected.path}`,
          suggestion: `Create folder: mkdir -p ${expected.path}`,
        });
      }
    }

    // Check for unexpected folders (strict modes only)
    if (blueprint.strictnessProfile !== 'prototype') {
      for (const actual of actualFolders) {
        const isExpected = expectedFolders.some((expected) =>
          this.pathsMatch(actual.path, expected.path)
        );

        if (!isExpected && !this.isAllowedFolder(actual.path)) {
          violations.push({
            type: 'unexpected_folder',
            severity: 'warning',
            message: `Unexpected folder: ${actual.path}`,
            suggestion: 'Remove folder or add to blueprint',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate file placement (files in correct folders)
   */
  private validateFilePlacement(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const expectedFiles = extractFilesFromTree(blueprint.folderTree);
    const actualFileList = actualFiles.filter((f) => f.type === 'file');

    for (const actual of actualFileList) {
      // Check if file is in an expected location
      const expected = expectedFiles.find((exp) =>
        this.pathsMatch(actual.path, exp.path)
      );

      if (!expected && !this.isConfigFile(actual.name)) {
        // File is not in blueprint
        const expectedParent = this.getExpectedParent(actual.path, expectedFiles);

        if (expectedParent) {
          violations.push({
            type: 'wrong_folder',
            severity: 'warning',
            message: `File may be in wrong folder: ${actual.path}`,
            file: actual.path,
            suggestion: `Consider moving to ${expectedParent}`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate folder depth doesn't exceed limit
   */
  private validateFolderDepth(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const maxDepth = blueprint.maxFolderDepth!;

    for (const file of actualFiles) {
      const depth = this.getFolderDepth(file.path);

      if (depth > maxDepth) {
        violations.push({
          type: 'folder_depth_exceeded',
          severity: 'warning',
          message: `Folder depth exceeds ${maxDepth}: ${file.path} (depth: ${depth})`,
          file: file.path,
          suggestion: 'Flatten folder structure',
        });
      }
    }

    return violations;
  }

  /**
   * Validate files per folder doesn't exceed limit
   */
  private validateFilesPerFolder(
    blueprint: Blueprint,
    actualFiles: FileEntry[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const maxFiles = blueprint.maxFilesPerFolder!;

    // Group files by folder
    const folderCounts = new Map<string, number>();

    for (const file of actualFiles) {
      if (file.type !== 'file') continue;

      const folder = this.getParentFolder(file.path);
      folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
    }

    // Check each folder
    for (const [folder, count] of folderCounts.entries()) {
      if (count > maxFiles) {
        violations.push({
          type: 'too_many_files',
          severity: 'warning',
          message: `Folder has too many files: ${folder} (${count} files, max: ${maxFiles})`,
          suggestion: 'Split into subfolders or modules',
        });
      }
    }

    return violations;
  }

  /**
   * Check if paths match (accounting for variations)
   */
  private pathsMatch(actual: string, expected: string): boolean {
    const normalize = (p: string) =>
      p.replace(/^\//, '').replace(/\/$/, '').toLowerCase();

    return normalize(actual) === normalize(expected);
  }

  /**
   * Check if folder is allowed (build artifacts, etc.)
   */
  private isAllowedFolder(folderPath: string): boolean {
    const allowed = ['node_modules', 'dist', 'build', '.git', 'coverage', 'blueprints'];
    return allowed.some((a) => folderPath.includes(a));
  }

  /**
   * Check if file is a config file
   */
  private isConfigFile(filename: string): boolean {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      '.gitignore',
      '.env',
      'README.md',
      'default.project.json',
    ];
    return configFiles.includes(filename);
  }

  /**
   * Get expected parent folder for a file
   */
  private getExpectedParent(
    filePath: string,
    expectedFiles: any[]
  ): string | null {
    const filename = filePath.split('/').pop() || '';

    for (const expected of expectedFiles) {
      if (expected.name === filename) {
        return expected.path;
      }
    }

    return null;
  }

  /**
   * Get folder depth
   */
  private getFolderDepth(path: string): number {
    return path.split('/').filter((p) => p).length;
  }

  /**
   * Get parent folder of a file
   */
  private getParentFolder(filePath: string): string {
    const parts = filePath.split('/');
    parts.pop(); // Remove filename
    return parts.join('/') || '/';
  }
}

/**
 * Singleton instance
 */
export const structureValidator = new StructureValidator();

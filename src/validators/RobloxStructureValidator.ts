/**
 * Roblox Structure Validator
 *
 * Validates Roblox project structure including:
 * - Client/Server/Shared folder organization
 * - ModuleScript naming conventions
 * - Forbidden mixing of server logic in client folders
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import { ProjectMode, getStrictnessProfile } from '../blueprint/StrictnessProfiles';
import { FileEntry, scanFileSystem } from './ValidationHelpers';

/**
 * Roblox folder requirements
 */
interface RobloxFolderRequirements {
  requiresClient: boolean;
  requiresServer: boolean;
  requiresShared: boolean;
}

/**
 * RobloxStructureValidator class
 */
export class RobloxStructureValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate Roblox project structure
   */
  async validate(mode: ProjectMode): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];
    const profile = getStrictnessProfile(mode);

    // Skip validation for prototype mode
    if (mode === 'prototype') {
      return createValidationReport(violations, mode);
    }

    // Scan file system
    const files = await scanFileSystem(this.projectRoot);

    // Validate folder structure
    violations.push(...this.validateFolderStructure(files, mode));

    // Validate ModuleScript naming
    violations.push(...this.validateModuleScriptNaming(files, mode));

    // Validate no server logic in client
    violations.push(...this.validateServerClientSeparation(files, mode));

    // Validate Luau file extensions
    violations.push(...this.validateLuauExtensions(files, mode));

    return createValidationReport(violations, mode);
  }

  /**
   * Validate required Roblox folders exist
   */
  private validateFolderStructure(
    files: FileEntry[],
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const folders = files.filter((f) => f.type === 'folder');

    const requirements = this.getFolderRequirements(mode);

    if (requirements.requiresClient) {
      const hasClient = folders.some((f) =>
        f.path.toLowerCase().includes('client')
      );
      if (!hasClient) {
        violations.push({
          type: 'missing_roblox_folder',
          severity: mode === 'production' ? 'error' : 'warning',
          message: 'Missing required client folder for Roblox project',
          suggestion: 'Create a client/ or src/client/ folder',
        });
      }
    }

    if (requirements.requiresServer) {
      const hasServer = folders.some((f) =>
        f.path.toLowerCase().includes('server')
      );
      if (!hasServer) {
        violations.push({
          type: 'missing_roblox_folder',
          severity: mode === 'production' ? 'error' : 'warning',
          message: 'Missing required server folder for Roblox project',
          suggestion: 'Create a server/ or src/server/ folder',
        });
      }
    }

    if (requirements.requiresShared) {
      const hasShared = folders.some((f) =>
        f.path.toLowerCase().includes('shared')
      );
      if (!hasShared) {
        violations.push({
          type: 'missing_roblox_folder',
          severity: 'warning',
          message: 'Consider adding a shared folder for common modules',
          suggestion: 'Create a shared/ or src/shared/ folder',
        });
      }
    }

    return violations;
  }

  /**
   * Validate ModuleScript naming conventions
   */
  private validateModuleScriptNaming(
    files: FileEntry[],
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const luaFiles = files.filter(
      (f) => f.type === 'file' && f.name.endsWith('.lua')
    );

    for (const file of luaFiles) {
      // ModuleScripts should use PascalCase
      const baseName = file.name.replace('.lua', '');

      if (mode !== 'prototype') {
        const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(baseName);

        if (!isPascalCase && !this.isSpecialFile(baseName)) {
          violations.push({
            type: 'roblox_naming_violation',
            severity: mode === 'production' ? 'error' : 'warning',
            message: `Roblox ModuleScript should use PascalCase: ${file.name}`,
            file: file.path,
            suggestion: `Rename to ${this.toPascalCase(baseName)}.lua`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate no server logic in client folders
   */
  private validateServerClientSeparation(
    files: FileEntry[],
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (mode === 'prototype') {
      return violations;
    }

    const luaFiles = files.filter(
      (f) => f.type === 'file' && f.name.endsWith('.lua')
    );

    for (const file of luaFiles) {
      const isInClientFolder = file.path.toLowerCase().includes('client');
      const hasServerPattern = this.hasServerPattern(file.name);

      if (isInClientFolder && hasServerPattern) {
        violations.push({
          type: 'roblox_server_in_client',
          severity: 'error',
          message: `Server-side code detected in client folder: ${file.path}`,
          file: file.path,
          suggestion: 'Move server logic to server/ folder',
        });
      }
    }

    return violations;
  }

  /**
   * Validate Luau file extensions
   */
  private validateLuauExtensions(
    files: FileEntry[],
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (mode === 'prototype') {
      return violations;
    }

    const robloxFiles = files.filter(
      (f) =>
        f.type === 'file' &&
        (f.path.includes('client') ||
          f.path.includes('server') ||
          f.path.includes('shared'))
    );

    for (const file of robloxFiles) {
      const isScript = file.name.endsWith('.lua') || file.name.endsWith('.luau');

      if (!isScript && !this.isConfigFile(file.name)) {
        violations.push({
          type: 'roblox_invalid_extension',
          severity: 'warning',
          message: `Non-Luau file in Roblox folder: ${file.path}`,
          file: file.path,
          suggestion: 'Roblox folders should contain .lua or .luau files',
        });
      }
    }

    return violations;
  }

  /**
   * Get folder requirements based on mode
   */
  private getFolderRequirements(mode: ProjectMode): RobloxFolderRequirements {
    return {
      requiresClient: mode !== 'prototype',
      requiresServer: mode !== 'prototype',
      requiresShared: false, // Optional
    };
  }

  /**
   * Check if file has server-specific patterns
   */
  private hasServerPattern(filename: string): boolean {
    const serverPatterns = ['server', 'Server', 'ServerScript', 'ServerStorage'];
    return serverPatterns.some((pattern) => filename.includes(pattern));
  }

  /**
   * Check if file is a special config file
   */
  private isConfigFile(filename: string): boolean {
    const configFiles = ['default.project.json', 'wally.toml', 'aftman.toml'];
    return configFiles.includes(filename);
  }

  /**
   * Check if file is a special Roblox file
   */
  private isSpecialFile(baseName: string): boolean {
    const specialFiles = ['init', 'server', 'client'];
    return specialFiles.includes(baseName.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, (char) => char.toUpperCase());
  }
}

/**
 * Singleton instance
 */
export const robloxStructureValidator = new RobloxStructureValidator();

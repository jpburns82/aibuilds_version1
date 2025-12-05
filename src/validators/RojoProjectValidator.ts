/**
 * Rojo Project Validator
 *
 * Validates Rojo default.project.json configuration files:
 * - Schema validation
 * - Folder → Instance mapping validation
 * - Missing Instance references
 * - Common Rojo configuration errors
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import { ProjectMode } from '../blueprint/StrictnessProfiles';

/**
 * Rojo tree node
 */
interface RojoTreeNode {
  $className?: string;
  $path?: string;
  [key: string]: any;
}

/**
 * Rojo project config
 */
interface RojoProject {
  name: string;
  tree: RojoTreeNode;
  servePlaceIds?: number[];
  servePort?: number;
}

/**
 * Rojo Project Validator
 */
export class RojoProjectValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate Rojo project configuration
   */
  async validate(mode: ProjectMode): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];

    // Find default.project.json
    const configPath = path.join(this.projectRoot, 'default.project.json');

    if (!fs.existsSync(configPath)) {
      if (mode !== 'prototype') {
        violations.push({
          type: 'missing_rojo_config',
          severity: mode === 'production' ? 'error' : 'warning',
          message: 'Missing default.project.json for Roblox project',
          suggestion: 'Create a default.project.json file in project root',
        });
      }
      return createValidationReport(violations, mode);
    }

    // Parse config
    let config: RojoProject;
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (error) {
      violations.push({
        type: 'invalid_rojo_config',
        severity: 'error',
        message: `Failed to parse default.project.json: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        file: 'default.project.json',
        suggestion: 'Fix JSON syntax errors',
      });
      return createValidationReport(violations, mode);
    }

    // Validate structure
    violations.push(...this.validateStructure(config, mode));

    // Validate tree paths
    violations.push(...(await this.validateTreePaths(config.tree, mode)));

    // Validate className references
    violations.push(...this.validateClassNames(config.tree, mode));

    return createValidationReport(violations, mode);
  }

  /**
   * Validate basic Rojo config structure
   */
  private validateStructure(
    config: RojoProject,
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!config.name) {
      violations.push({
        type: 'missing_rojo_field',
        severity: 'error',
        message: 'Missing required "name" field in default.project.json',
        file: 'default.project.json',
        suggestion: 'Add a "name" field with your project name',
      });
    }

    if (!config.tree) {
      violations.push({
        type: 'missing_rojo_field',
        severity: 'error',
        message: 'Missing required "tree" field in default.project.json',
        file: 'default.project.json',
        suggestion: 'Add a "tree" field with your project structure',
      });
    }

    return violations;
  }

  /**
   * Validate $path references in tree
   */
  private async validateTreePaths(
    tree: RojoTreeNode,
    mode: ProjectMode
  ): Promise<ValidationViolation[]> {
    const violations: ValidationViolation[] = [];

    const checkNode = async (node: RojoTreeNode, nodePath: string = '') => {
      if (node.$path) {
        const fullPath = path.join(this.projectRoot, node.$path);

        if (!fs.existsSync(fullPath)) {
          const severity = mode === 'prototype' ? 'warning' : 'error';
          violations.push({
            type: 'missing_rojo_path',
            severity,
            message: `Rojo $path reference not found: ${node.$path}`,
            file: 'default.project.json',
            suggestion: `Create the folder/file at ${node.$path}`,
          });
        }
      }

      // Recursively check children
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue; // Skip Rojo special fields

        if (typeof value === 'object' && value !== null) {
          await checkNode(value as RojoTreeNode, `${nodePath}/${key}`);
        }
      }
    };

    await checkNode(tree);
    return violations;
  }

  /**
   * Validate $className references
   */
  private validateClassNames(
    tree: RojoTreeNode,
    mode: ProjectMode
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const validClassNames = this.getValidRobloxClassNames();

    const checkNode = (node: RojoTreeNode, nodePath: string = '') => {
      if (node.$className) {
        if (!validClassNames.includes(node.$className)) {
          violations.push({
            type: 'invalid_rojo_classname',
            severity: mode === 'production' ? 'error' : 'warning',
            message: `Unknown Roblox className: ${node.$className}`,
            file: 'default.project.json',
            suggestion: `Verify ${node.$className} is a valid Roblox Instance class`,
          });
        }
      }

      // Recursively check children
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;

        if (typeof value === 'object' && value !== null) {
          checkNode(value as RojoTreeNode, `${nodePath}/${key}`);
        }
      }
    };

    checkNode(tree);
    return violations;
  }

  /**
   * Get list of valid Roblox class names
   */
  private getValidRobloxClassNames(): string[] {
    return [
      'Folder',
      'ModuleScript',
      'Script',
      'LocalScript',
      'ServerScriptService',
      'ReplicatedStorage',
      'StarterPlayer',
      'StarterGui',
      'Workspace',
      'Players',
      'Lighting',
      'SoundService',
      'Configuration',
      'IntValue',
      'StringValue',
      'BoolValue',
      'ObjectValue',
      'NumberValue',
      'Model',
      'Part',
      'MeshPart',
      'Tool',
      'ScreenGui',
      'Frame',
      'TextLabel',
      'TextButton',
      'ImageLabel',
      'ScrollingFrame',
    ];
  }
}

/**
 * Singleton instance
 */
export const rojoProjectValidator = new RojoProjectValidator();

/**
 * Dependency Validator
 *
 * Validates dependencies against blueprint rules:
 * - Allowed/forbidden imports
 * - Circular dependency detection
 * - Version compatibility
 * - Import pattern validation
 */

import * as fs from 'fs';
import {
  Blueprint,
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import { FileEntry, scanFileSystem } from './ValidationHelpers';
import {
  DependencyNode,
  isRelativeImport,
  resolveImport,
  getFolder,
  detectCircularDependencies,
} from './DependencyHelpers';

/**
 * Dependency Validator
 */
export class DependencyValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate dependencies
   */
  async validate(blueprint: Blueprint): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];
    const files = await scanFileSystem(this.projectRoot);

    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(files);

    // Validate allowed/forbidden imports
    violations.push(
      ...this.validateImportRules(dependencyGraph, blueprint)
    );

    // Validate circular dependencies (if enabled)
    if (
      blueprint.strictnessProfile === 'mvp' ||
      blueprint.strictnessProfile === 'production'
    ) {
      violations.push(...detectCircularDependencies(dependencyGraph));
    }

    // Validate cross-folder imports (if restricted)
    if (!blueprint.dependencyRules.allowCrossFolderImports) {
      violations.push(...this.validateCrossFolderImports(dependencyGraph));
    }

    return createValidationReport(violations, blueprint.strictnessProfile);
  }

  /**
   * Build dependency graph from files
   */
  private async buildDependencyGraph(
    files: FileEntry[]
  ): Promise<DependencyNode[]> {
    const graph: DependencyNode[] = [];

    for (const file of files) {
      if (file.type !== 'file') continue;
      if (!this.isCodeFile(file.name)) continue;

      const content = await this.readFile(file.path);
      if (!content) continue;

      const imports = this.extractImports(content);

      graph.push({
        file: file.path,
        imports,
      });
    }

    return graph;
  }

  /**
   * Extract imports from file content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const es6ImportRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Validate import rules (allowed/forbidden)
   */
  private validateImportRules(
    graph: DependencyNode[],
    blueprint: Blueprint
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const rules = blueprint.dependencyRules;

    for (const node of graph) {
      for (const imp of node.imports) {
        // Check forbidden imports
        if (rules.forbiddenImports.some((forbidden) => imp.includes(forbidden))) {
          violations.push({
            type: 'forbidden_import',
            severity: 'error',
            message: `Forbidden import in ${node.file}: ${imp}`,
            file: node.file,
            suggestion: 'Remove forbidden import',
          });
        }

        // Check allowed imports (if whitelist is defined)
        if (
          rules.allowedImports.length > 0 &&
          !isRelativeImport(imp) &&
          !rules.allowedImports.some((allowed) => imp.startsWith(allowed))
        ) {
          violations.push({
            type: 'disallowed_import',
            severity: 'warning',
            message: `Import not in allowlist: ${imp} in ${node.file}`,
            file: node.file,
            suggestion: 'Use only allowed dependencies',
          });
        }

        // Check relative imports (if forbidden)
        if (
          !rules.allowRelativeImports &&
          isRelativeImport(imp)
        ) {
          violations.push({
            type: 'relative_import_forbidden',
            severity: 'warning',
            message: `Relative import forbidden: ${imp} in ${node.file}`,
            file: node.file,
            suggestion: 'Use absolute imports',
          });
        }
      }
    }

    return violations;
  }


  /**
   * Validate cross-folder imports
   */
  private validateCrossFolderImports(
    graph: DependencyNode[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const node of graph) {
      const nodeFolder = getFolder(node.file);

      for (const imp of node.imports) {
        if (!isRelativeImport(imp)) continue;

        const resolvedPath = resolveImport(node.file, imp);
        const importFolder = getFolder(resolvedPath);

        if (nodeFolder !== importFolder) {
          violations.push({
            type: 'cross_folder_import',
            severity: 'warning',
            message: `Cross-folder import in ${node.file}: ${imp}`,
            file: node.file,
            suggestion: 'Avoid cross-folder imports',
          });
        }
      }
    }

    return violations;
  }


  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    return codeExtensions.some((ext) => filename.endsWith(ext));
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string | null> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }
}

/**
 * Singleton instance
 */
export const dependencyValidator = new DependencyValidator();

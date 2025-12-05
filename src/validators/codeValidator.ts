/**
 * Code Validator
 *
 * Validates code quality against blueprint rules:
 * - Syntax validation
 * - Linting (basic)
 * - Dead code detection
 * - Max line count enforcement
 * - Security issues (forbidden APIs)
 */

import * as fs from 'fs';
import {
  Blueprint,
  ValidationViolation,
  BlueprintValidationReport,
  createValidationReport,
} from '../blueprint/BlueprintSchema';
import { getSeverityForViolation } from '../blueprint/StrictnessProfiles';
import { FileEntry, scanFileSystem } from './ValidationHelpers';

/**
 * Code Validator
 */
export class CodeValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate code quality
   */
  async validate(blueprint: Blueprint): Promise<BlueprintValidationReport> {
    const violations: ValidationViolation[] = [];
    const files = await scanFileSystem(this.projectRoot);

    // Get code files only
    const codeFiles = files.filter((f) =>
      this.isCodeFile(f.name)
    );

    for (const file of codeFiles) {
      const content = await this.readFile(file.path);
      if (!content) continue;

      // Validate syntax (basic)
      violations.push(...this.validateSyntax(file, content, blueprint));

      // Validate forbidden APIs
      if (blueprint.securityRules) {
        violations.push(
          ...this.validateSecurity(file, content, blueprint)
        );
      }

      // Validate dead code
      violations.push(...this.detectDeadCode(file, content, blueprint));

      // Validate line count (already done by BlueprintValidator but double-check)
      if (file.lines && file.lines > blueprint.maxLinesPerFile) {
        violations.push({
          type: 'line_count_exceeded',
          severity: getSeverityForViolation('line_count_exceeded', {
            mode: blueprint.strictnessProfile as any,
          } as any),
          message: `File exceeds ${blueprint.maxLinesPerFile} lines: ${file.path} (${file.lines} lines)`,
          file: file.path,
          suggestion: 'Refactor into helper modules',
        });
      }
    }

    return createValidationReport(violations, blueprint.strictnessProfile);
  }

  /**
   * Validate basic syntax
   */
  private validateSyntax(
    file: FileEntry,
    content: string,
    blueprint: Blueprint
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Check for syntax errors (basic checks)
    const syntaxIssues: string[] = [];

    // Unclosed braces/brackets/parens
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      syntaxIssues.push('Mismatched curly braces');
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      syntaxIssues.push('Mismatched square brackets');
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      syntaxIssues.push('Mismatched parentheses');
    }

    for (const issue of syntaxIssues) {
      violations.push({
        type: 'syntax_error',
        severity: 'error',
        message: `Syntax issue in ${file.path}: ${issue}`,
        file: file.path,
        suggestion: 'Fix syntax errors',
      });
    }

    return violations;
  }

  /**
   * Validate security (forbidden APIs)
   */
  private validateSecurity(
    file: FileEntry,
    content: string,
    blueprint: Blueprint
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!blueprint.securityRules) return violations;

    // Check for forbidden APIs
    const forbiddenPatterns = [
      { pattern: /\beval\s*\(/, name: 'eval()' },
      { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
      { pattern: /require\.cache/, name: 'require.cache' },
      { pattern: /process\.env\[/, name: 'dynamic process.env access' },
      { pattern: /dangerouslySetInnerHTML/, name: 'dangerouslySetInnerHTML' },
    ];

    for (const { pattern, name } of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push({
          type: 'security_issue',
          severity: 'critical',
          message: `Forbidden API usage in ${file.path}: ${name}`,
          file: file.path,
          suggestion: `Remove ${name} usage - security risk`,
        });
      }
    }

    // Check for potential secrets
    if (blueprint.securityRules.scanForSecrets) {
      const secretPatterns = [
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, name: 'API key' },
        { pattern: /password\s*=\s*['"][^'"]+['"]/i, name: 'hardcoded password' },
        { pattern: /secret\s*=\s*['"][^'"]+['"]/i, name: 'hardcoded secret' },
        { pattern: /token\s*=\s*['"][^'"]+['"]/i, name: 'hardcoded token' },
      ];

      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(content)) {
          violations.push({
            type: 'security_issue',
            severity: 'critical',
            message: `Potential ${name} hardcoded in ${file.path}`,
            file: file.path,
            suggestion: 'Move secrets to environment variables',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Detect dead code (basic)
   */
  private detectDeadCode(
    file: FileEntry,
    content: string,
    blueprint: Blueprint
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Skip for prototype mode
    if (blueprint.strictnessProfile === 'prototype') {
      return violations;
    }

    // Check for unused imports (basic detection)
    const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }

    // Very basic check: if import appears only once, might be unused
    for (const imp of imports) {
      const importedName = imp.match(/import\s+(?:{([^}]+)}|(\w+))/)?.[1] || '';
      if (importedName) {
        const names = importedName.split(',').map((n) => n.trim());
        for (const name of names) {
          const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
          const usageCount = (content.match(new RegExp(`\\b${cleanName}\\b`, 'g')) || []).length;

          if (usageCount === 1) {
            violations.push({
              type: 'unused_import',
              severity: 'warning',
              message: `Potentially unused import in ${file.path}: ${cleanName}`,
              file: file.path,
              suggestion: `Remove unused import: ${cleanName}`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.lua', '.luau'];
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
export const codeValidator = new CodeValidator();

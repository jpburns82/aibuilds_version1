/**
 * Dependency Validation Helpers
 *
 * Helper functions extracted from DependencyValidator to maintain <300 line limit
 */

import { ValidationViolation } from '../blueprint/BlueprintSchema';

/**
 * Dependency graph node
 */
export interface DependencyNode {
  file: string;
  imports: string[];
}

/**
 * Check if import is relative
 */
export function isRelativeImport(imp: string): boolean {
  return imp.startsWith('./') || imp.startsWith('../');
}

/**
 * Resolve relative import to full path
 */
export function resolveImport(fromFile: string, importPath: string): string {
  const fromDir = fromFile.split('/').slice(0, -1).join('/');
  const parts = importPath.split('/');
  const dirParts = fromDir.split('/');

  for (const part of parts) {
    if (part === '..') {
      dirParts.pop();
    } else if (part !== '.') {
      dirParts.push(part);
    }
  }

  let resolved = dirParts.join('/');

  // Add .ts/.js extension if missing
  if (!resolved.endsWith('.ts') && !resolved.endsWith('.js')) {
    resolved += '.ts';
  }

  return resolved;
}

/**
 * Get folder of a file
 */
export function getFolder(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop(); // Remove filename
  return parts.join('/') || '/';
}

/**
 * Detect circular dependencies in dependency graph
 */
export function detectCircularDependencies(
  graph: DependencyNode[]
): ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const detectCycle = (node: DependencyNode, path: string[]): boolean => {
    if (recursionStack.has(node.file)) {
      // Found a cycle
      const cycleStart = path.indexOf(node.file);
      const cycle = [...path.slice(cycleStart), node.file];

      violations.push({
        type: 'circular_dependency',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        file: node.file,
        suggestion: 'Break circular dependency by refactoring',
      });

      return true;
    }

    if (visited.has(node.file)) {
      return false;
    }

    visited.add(node.file);
    recursionStack.add(node.file);

    for (const imp of node.imports) {
      // Only check relative imports for circular deps
      if (!isRelativeImport(imp)) continue;

      const resolvedPath = resolveImport(node.file, imp);
      const importedNode = graph.find((n) => n.file === resolvedPath);

      if (importedNode) {
        if (detectCycle(importedNode, [...path, node.file])) {
          // Cycle found, stop searching
          break;
        }
      }
    }

    recursionStack.delete(node.file);
    return false;
  };

  for (const node of graph) {
    if (!visited.has(node.file)) {
      detectCycle(node, []);
    }
  }

  return violations;
}

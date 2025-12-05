/**
 * Validation Helpers
 *
 * Extracted from BlueprintValidator to maintain <300 line limit.
 * Handles naming validation and file system scanning.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File system entry for validation
 */
export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'folder';
  lines?: number;
}

/**
 * Check if filename matches naming pattern
 */
export function matchesNamingPattern(name: string, pattern: string): boolean {
  // Remove extension for files
  const baseName = name.replace(/\.[^.]+$/, '');

  switch (pattern) {
    case 'camelCase':
      return /^[a-z][a-zA-Z0-9]*$/.test(baseName);
    case 'PascalCase':
      return /^[A-Z][a-zA-Z0-9]*$/.test(baseName);
    case 'kebab-case':
      return /^[a-z][a-z0-9-]*$/.test(baseName);
    case 'snake_case':
      return /^[a-z][a-z0-9_]*$/.test(baseName);
    case 'SCREAMING_SNAKE_CASE':
      return /^[A-Z][A-Z0-9_]*$/.test(baseName);
    default:
      return true;
  }
}

/**
 * Check if a file is an allowed extra (config files, etc.)
 */
export function isAllowedExtra(filePath: string): boolean {
  const allowedExtras = [
    '.gitignore',
    '.env',
    '.env.example',
    'package.json',
    'tsconfig.json',
    'README.md',
    '.npmrc',
    'jest.config.js',
  ];

  return allowedExtras.some((allowed) => filePath.endsWith(allowed));
}

/**
 * Check if file/folder should be skipped during scanning
 */
export function shouldSkip(name: string): boolean {
  const skipList = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    'blueprints',
    'generated',
  ];
  return skipList.includes(name);
}

/**
 * Count lines in a file
 */
export async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Scan file system to get actual files
 */
export async function scanFileSystem(rootPath: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  const scan = async (currentPath: string, relativePath: string = '') => {
    const items = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const item of items) {
      // Skip node_modules, .git, etc.
      if (shouldSkip(item.name)) continue;

      const fullPath = path.join(currentPath, item.name);
      const relPath = path.join(relativePath, item.name);

      if (item.isDirectory()) {
        entries.push({
          path: relPath,
          name: item.name,
          type: 'folder',
        });
        await scan(fullPath, relPath);
      } else if (item.isFile()) {
        const lines = await countLines(fullPath);
        entries.push({
          path: relPath,
          name: item.name,
          type: 'file',
          lines,
        });
      }
    }
  };

  await scan(rootPath);
  return entries;
}

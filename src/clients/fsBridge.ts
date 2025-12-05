/**
 * File System Bridge
 *
 * Helper for reading project folder trees and file contents.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File tree node structure
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

/**
 * Directories to ignore when building tree
 */
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
];

/**
 * Build file tree from a directory
 */
export function buildFileTree(rootPath: string, basePath: string = ''): FileTreeNode | null {
  try {
    const stats = fs.statSync(rootPath);

    if (!stats.isDirectory()) {
      return null;
    }

    const name = path.basename(rootPath);

    if (IGNORED_DIRS.includes(name)) {
      return null;
    }

    const children: FileTreeNode[] = [];
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });

    // Sort: folders first, then files, alphabetically
    const sortedEntries = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sortedEntries) {
      const entryPath = path.join(rootPath, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          const subtree = buildFileTree(entryPath, relativePath);
          if (subtree) {
            children.push(subtree);
          }
        }
      } else {
        children.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
        });
      }
    }

    return {
      name,
      path: basePath || '/',
      type: 'folder',
      children,
    };
  } catch (error) {
    console.error(`Failed to build file tree for ${rootPath}:`, error);
    return null;
  }
}

/**
 * Read file content
 */
export function readFileContent(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return null;
    }

    // Limit file size to 1MB
    if (stats.size > 1024 * 1024) {
      return '[File too large to display]';
    }

    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    return null;
  }
}

/**
 * Check if path exists and is a file
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if path exists and is a directory
 */
export function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get file info
 */
export function getFileInfo(filePath: string): {
  exists: boolean;
  size: number;
  modified: Date | null;
  extension: string;
} {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, size: 0, modified: null, extension: '' };
    }

    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath);

    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      extension,
    };
  } catch {
    return { exists: false, size: 0, modified: null, extension: '' };
  }
}

/**
 * Blueprint Tree Builder Helper
 *
 * Extracted from BlueprintGenerator to maintain <300 line limit.
 * Handles folder tree construction logic.
 */

import * as path from 'path';
import { FolderNode } from './BlueprintSchema';

/**
 * Build folder tree from specification
 */
export function buildFolderTree(
  projectName: string,
  folders: string[],
  files: string[]
): FolderNode {
  const root: FolderNode = {
    name: projectName,
    type: 'folder',
    path: '/',
    required: true,
    children: [],
  };

  // Add folders
  for (const folder of folders) {
    addFolderToTree(root, folder);
  }

  // Add files
  for (const file of files) {
    addFileToTree(root, file);
  }

  return root;
}

/**
 * Add folder to tree
 */
export function addFolderToTree(root: FolderNode, folderPath: string): void {
  const parts = folderPath.split('/').filter((p) => p);
  let current = root;

  for (const part of parts) {
    let existing = current.children?.find((c) => c.name === part);

    if (!existing) {
      const newNode: FolderNode = {
        name: part,
        type: 'folder',
        path: `${current.path}${part}/`,
        required: true,
        children: [],
      };

      if (!current.children) current.children = [];
      current.children.push(newNode);
      existing = newNode;
    }

    current = existing;
  }
}

/**
 * Add file to tree
 */
export function addFileToTree(root: FolderNode, filePath: string): void {
  const parts = filePath.split('/').filter((p) => p);
  const fileName = parts.pop()!;
  const folderPath = parts.join('/');

  // Ensure folder exists
  if (folderPath) {
    addFolderToTree(root, folderPath);
  }

  // Find parent folder
  let current = root;
  for (const part of parts) {
    current = current.children!.find((c) => c.name === part)!;
  }

  // Add file
  if (!current.children) current.children = [];
  current.children.push({
    name: fileName,
    type: 'file',
    path: `${current.path}${fileName}`,
    required: true,
    fileType: getFileType(fileName),
  });
}

/**
 * Get file type from extension
 */
export function getFileType(fileName: string): string {
  const ext = path.extname(fileName);
  return ext.slice(1) || 'unknown';
}

/**
 * Extract folders from folder tree
 */
export function extractFoldersFromTree(node: FolderNode): FolderNode[] {
  const folders: FolderNode[] = [];

  if (node.type === 'folder') {
    folders.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      folders.push(...extractFoldersFromTree(child));
    }
  }

  return folders;
}

/**
 * Extract files from folder tree
 */
export function extractFilesFromTree(node: FolderNode): FolderNode[] {
  const files: FolderNode[] = [];

  if (node.type === 'file') {
    files.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      files.push(...extractFilesFromTree(child));
    }
  }

  return files;
}

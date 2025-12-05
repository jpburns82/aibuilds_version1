/**
 * ProjectFolderTree Component
 *
 * Displays project file structure as a collapsible tree with context menu.
 */

import { useState, useCallback } from 'react';
import { FileTreeNode } from '../types';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { TreeNode } from './TreeNode';
import './ProjectFolderTree.css';

interface ContextMenuState {
  x: number;
  y: number;
  node: FileTreeNode;
}

interface ProjectFolderTreeProps {
  tree: FileTreeNode | null;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onDelete?: (path: string) => void;
  onRename?: (path: string) => void;
  onCopyPath?: (path: string) => void;
  loading?: boolean;
}

export function ProjectFolderTree({
  tree,
  selectedPath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onCopyPath,
  loading = false,
}: ProjectFolderTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { node } = contextMenu;
    const isFolder = node.type === 'folder';
    const items: ContextMenuItem[] = [];

    if (!isFolder) {
      items.push({ label: 'Open', icon: '📄', action: () => onSelectFile(node.path) });
    }

    if (isFolder && onCreateFile) {
      items.push({ label: 'New File', icon: '📝', action: () => onCreateFile(node.path) });
    }

    if (isFolder && onCreateFolder) {
      items.push({ label: 'New Folder', icon: '📁', action: () => onCreateFolder(node.path) });
    }

    if (items.length > 0) {
      items.push({ label: '', icon: '', action: () => {}, separator: true });
    }

    if (onCopyPath) {
      items.push({
        label: 'Copy Path',
        icon: '📋',
        action: () => {
          onCopyPath(node.path);
          navigator.clipboard.writeText(node.path);
        },
      });
    }

    if (onRename) {
      items.push({ label: 'Rename', icon: '✏️', action: () => onRename(node.path) });
    }

    if (onDelete) {
      items.push({ label: '', icon: '', action: () => {}, separator: true });
      items.push({ label: 'Delete', icon: '🗑️', action: () => onDelete(node.path) });
    }

    if (items.length === 0) {
      items.push({
        label: 'Copy Path',
        icon: '📋',
        action: () => navigator.clipboard.writeText(node.path),
      });
    }

    return items;
  }, [contextMenu, onSelectFile, onCreateFile, onCreateFolder, onDelete, onRename, onCopyPath]);

  const expandAll = useCallback(() => {
    if (!tree) return;
    const allPaths = new Set<string>();
    const collectPaths = (node: FileTreeNode) => {
      if (node.type === 'folder') {
        allPaths.add(node.path);
        node.children?.forEach(collectPaths);
      }
    };
    collectPaths(tree);
    setExpandedPaths(allPaths);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  if (loading) {
    return (
      <div className="project-folder-tree project-folder-tree--loading">
        <div className="project-folder-tree__spinner">Loading...</div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="project-folder-tree project-folder-tree--empty">
        <div className="project-folder-tree__placeholder">
          <span>No project loaded</span>
          <small>Start a session to see files</small>
        </div>
      </div>
    );
  }

  return (
    <div className="project-folder-tree">
      <div className="project-folder-tree__toolbar">
        <button className="project-folder-tree__toolbar-btn" onClick={expandAll} title="Expand All">
          ⊞
        </button>
        <button className="project-folder-tree__toolbar-btn" onClick={collapseAll} title="Collapse All">
          ⊟
        </button>
      </div>
      <div className="project-folder-tree__content">
        <TreeNode
          node={tree}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          expandedPaths={expandedPaths}
          toggleExpanded={toggleExpanded}
          onContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

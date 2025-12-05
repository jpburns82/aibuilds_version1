/**
 * ProjectFolderTree Component
 *
 * Displays project file structure as a collapsible tree.
 */

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { FileTreeNode } from '../types';
import './ProjectFolderTree.css';

interface ProjectFolderTreeProps {
  tree: FileTreeNode | null;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  loading?: boolean;
}

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelectFile,
  expandedPaths,
  toggleExpanded,
}: TreeNodeProps) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = node.path === selectedPath;

  const handleClick = () => {
    if (isFolder) {
      toggleExpanded(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const getFileIcon = (name: string): string => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return '📘';
    if (name.endsWith('.js') || name.endsWith('.jsx')) return '📙';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.md')) return '📝';
    if (name.endsWith('.lua')) return '🌙';
    return '📄';
  };

  return (
    <div className="tree-node">
      <div
        className={clsx('tree-node__row', {
          'tree-node__row--selected': isSelected,
          'tree-node__row--folder': isFolder,
        })}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="tree-node__arrow">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="tree-node__icon">
          {isFolder ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name)}
        </span>
        <span className="tree-node__name">{node.name}</span>
      </div>

      {isFolder && isExpanded && node.children && (
        <div className="tree-node__children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectFolderTree({
  tree,
  selectedPath,
  onSelectFile,
  loading = false,
}: ProjectFolderTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

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
      <TreeNode
        node={tree}
        depth={0}
        selectedPath={selectedPath}
        onSelectFile={onSelectFile}
        expandedPaths={expandedPaths}
        toggleExpanded={toggleExpanded}
      />
    </div>
  );
}

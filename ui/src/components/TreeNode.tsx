/**
 * TreeNode Component
 *
 * Individual tree node for the file explorer.
 */

import clsx from 'clsx';
import { FileTreeNode } from '../types';

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    ts: '📘', tsx: '📘',
    js: '📙', jsx: '📙',
    json: '📋',
    css: '🎨', scss: '🎨', less: '🎨',
    md: '📝',
    lua: '🌙', luau: '🌙',
    html: '🌐',
    svg: '🖼️', png: '🖼️', jpg: '🖼️',
    yaml: '⚙️', yml: '⚙️',
    env: '🔒',
    git: '🔀', gitignore: '🔀',
  };
  return iconMap[ext || ''] || '📄';
}

export function TreeNode({
  node,
  depth,
  selectedPath,
  onSelectFile,
  expandedPaths,
  toggleExpanded,
  onContextMenu,
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node);
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
        onContextMenu={handleContextMenu}
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
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

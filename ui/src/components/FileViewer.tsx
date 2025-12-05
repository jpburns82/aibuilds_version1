/**
 * FileViewer Component
 *
 * Displays file content with syntax highlighting using Monaco Editor.
 */

import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import './FileViewer.css';

interface FileViewerProps {
  path: string | null;
  content: string;
  loading?: boolean;
}

export function FileViewer({ path, content, loading = false }: FileViewerProps) {
  const language = useMemo(() => {
    if (!path) return 'plaintext';

    const ext = path.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      scss: 'scss',
      html: 'html',
      md: 'markdown',
      lua: 'lua',
      luau: 'lua',
      yaml: 'yaml',
      yml: 'yaml',
    };

    return languageMap[ext || ''] || 'plaintext';
  }, [path]);

  const filename = useMemo(() => {
    if (!path) return null;
    return path.split('/').pop();
  }, [path]);

  if (loading) {
    return (
      <div className="file-viewer file-viewer--loading">
        <div className="file-viewer__spinner">Loading file...</div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="file-viewer file-viewer--empty">
        <div className="file-viewer__placeholder">
          <span>No file selected</span>
          <small>Click a file in the tree to view</small>
        </div>
      </div>
    );
  }

  return (
    <div className="file-viewer">
      <div className="file-viewer__header">
        <span className="file-viewer__filename">{filename}</span>
        <span className="file-viewer__path">{path}</span>
      </div>
      <div className="file-viewer__editor">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

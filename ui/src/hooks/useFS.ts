/**
 * useFS Hook
 *
 * Manages file system tree and file content viewing.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { FileTreeNode } from '../types';

const API_BASE = '/api';

export function useFS() {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (basePath?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = basePath ? { basePath } : {};
      const response = await axios.get(`${API_BASE}/fs/tree`, { params });
      setTree(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load file tree';
      setError(message);
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFile = useCallback(async (path: string) => {
    setSelectedPath(path);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/fs/file`, {
        params: { path },
      });
      setContent(response.data.content || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load file';
      setError(message);
      setContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPath(null);
    setContent('');
  }, []);

  const refresh = useCallback(async () => {
    if (tree) {
      await fetchTree();
    }
    if (selectedPath) {
      await selectFile(selectedPath);
    }
  }, [tree, selectedPath, fetchTree, selectFile]);

  return {
    tree,
    selectedPath,
    content,
    loading,
    error,
    fetchTree,
    selectFile,
    clearSelection,
    refresh,
  };
}

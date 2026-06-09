import { useState, useCallback } from 'react';
import { foldersService } from '../services/api';
import type { Folder } from '../types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await foldersService.getAll();
      setFolders(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (data: { name: string; color?: string; icon?: string }) => {
    const created = await foldersService.create(data);
    setFolders(prev => [...prev, created]);
    return created;
  }, []);

  const updateFolder = useCallback(async (id: string, data: { name?: string; color?: string; icon?: string }) => {
    const updated = await foldersService.update(id, data);
    setFolders(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await foldersService.remove(id);
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  return { folders, loading, fetchFolders, createFolder, updateFolder, deleteFolder };
}

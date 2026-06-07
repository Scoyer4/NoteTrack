import { useState, useCallback } from 'react';
import { foldersService } from '../services/api';
import type { Folder } from '../types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await foldersService.getAll();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar carpetas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (data: { name: string; color?: string; icon?: string }) => {
    const created = await foldersService.create(data);
    setFolders(prev => [...prev, created]);
    return created;
  }, []);

  const updateFolder = useCallback(async (id: string, data: Partial<Pick<Folder, 'name' | 'color' | 'icon' | 'position'>>) => {
    const updated = await foldersService.update(id, data);
    setFolders(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    await foldersService.remove(id);
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  return { folders, loading, error, fetchFolders, createFolder, updateFolder, removeFolder };
}

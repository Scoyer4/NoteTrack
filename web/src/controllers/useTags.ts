import { useState, useCallback } from 'react';
import { tagsService } from '../services/api';
import type { Tag } from '../types';

export function useTags() {
  const [tags,    setTags]    = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagsService.getAll();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar etiquetas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (data: { name: string; color?: string }) => {
    const created = await tagsService.create(data);
    setTags(prev => [...prev, created]);
    return created;
  }, []);

  const removeTag = useCallback(async (id: string) => {
    await tagsService.remove(id);
    setTags(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tags, loading, error, fetchTags, createTag, removeTag };
}

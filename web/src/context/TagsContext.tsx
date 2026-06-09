import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { tagsService } from '../services/api';
import type { Tag } from '../types';

interface TagsContextValue {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (data: { name: string; color?: string }) => Promise<Tag>;
  removeTag: (id: string) => Promise<void>;
}

const TagsContext = createContext<TagsContextValue | null>(null);

export function TagsProvider({ children }: { children: ReactNode }) {
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

  return (
    <TagsContext.Provider value={{ tags, loading, error, fetchTags, createTag, removeTag }}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTags(): TagsContextValue {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error('useTags must be used inside TagsProvider');
  return ctx;
}

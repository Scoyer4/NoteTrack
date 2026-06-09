import { useState, useCallback } from 'react';
import { notesService } from '../services/api';
import type { Note, NoteColor } from '../types';

export function useNotes() {
  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchNotes = useCallback(async (params?: { search?: string; folderId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await notesService.getAll(params);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (data: { title: string; content?: string; color?: NoteColor; folder_id?: string | null }) => {
    const created = await notesService.create(data);
    setNotes(prev => [created, ...prev]);
    return created;
  }, []);

  const updateNote = useCallback(async (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'color' | 'is_pinned' | 'is_archived' | 'folder_id'>>) => {
    const updated = await notesService.update(id, data);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  }, []);

  const softDeleteNote = useCallback(async (id: string) => {
    const updated = await notesService.softDelete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    return updated;
  }, []);

  const hardDeleteNote = useCallback(async (id: string) => {
    await notesService.hardDelete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const pinNote = useCallback(async (id: string) => {
    const updated = await notesService.pin(id);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  }, []);

  /** Toggles is_archived and removes from current list */
  const archiveNote = useCallback(async (id: string) => {
    const updated = await notesService.archive(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    return updated;
  }, []);

  /** Restores a deleted note and removes from current list */
  const restoreNote = useCallback(async (id: string) => {
    const updated = await notesService.restore(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    return updated;
  }, []);

  return {
    notes, loading, error,
    fetchNotes, createNote, updateNote,
    softDeleteNote, hardDeleteNote,
    pinNote, archiveNote, restoreNote,
  };
}

import { useState, useCallback } from 'react';
import { tasksService } from '../services/api';
import type { Task } from '../types';

export function useTasks() {
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (noteId: string) => {
    setLoading(true);
    try {
      const data = await tasksService.getByNote(noteId);
      setTasks(data.sort((a, b) => a.position - b.position));
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (noteId: string, title: string) => {
    const created = await tasksService.create(noteId, { title });
    setTasks(prev => [...prev, created]);
    return created;
  }, []);

  const toggleTask = useCallback(async (id: string, current: boolean) => {
    const updated = await tasksService.update(id, { is_completed: !current });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await tasksService.remove(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearTasks = useCallback(() => setTasks([]), []);

  return { tasks, loading, fetchTasks, createTask, toggleTask, removeTask, clearTasks };
}

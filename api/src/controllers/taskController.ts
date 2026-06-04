import { Request, Response } from 'express'
import { taskRepository } from '@/repositories/taskRepository'
import { getErrorMessage } from '@/lib/errors'
import { notesRepository } from '@/repositories/notesRepository';

export const taskController = {
   // Obtener tarea por nota
  getByNote: async (req: Request<{ noteId: string }>, res: Response) => {
    try {
      const { noteId } = req.params;
      const userId = req.user!.id;

      const note = await notesRepository.findById(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: "No se ha encontrado la nota." });
      }

      const task = await taskRepository.findByNote(noteId);
      return res.json(task);
    } catch (error) {
      console.error("Error obteniendo las tareas.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getUpcoming: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const task = await taskRepository.findUpcoming(userId);
      return res.json(task);
    } catch (error) {
      console.error('Error obteniendo las tareas próximas.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  create: async (req: Request<{ noteId: string }>, res: Response) => {
    try {
      const { noteId } = req.params;
      const userId = req.user!.id;
      const {title, position, due_date } = req.body;

      if (!title) {
        return res.status(400).json({ error: "El título es obligatorio." });
      }

      const note = await notesRepository.findById(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: "No se ha encontrado la nota." });
      }

      const createdTask = await taskRepository.create({
        note_id: noteId,
        title,
        position,
        due_date: due_date ?? null,
      });

      return res.status(201).json(createdTask);
    } catch (error) {
      console.error('Error creando la tarea.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const {title, is_completed, position, due_date} = req.body;

      const existing = await taskRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ error: "La tarea no existe o no se ha encontrado." })
      }

      const note = await notesRepository.findById(existing.note_id, userId);
      if (!note) {
        return res.status(403).json({ error: "No tienes permiso para modificar esta tarea." });
      }

      const updatedTask = await taskRepository.update(id, {
        title,
        is_completed,
        position,
        due_date,
      });

      return res.json(updatedTask);
    } catch (error) {
      console.error("Error actualizando la tarea.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  toggleComplete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await taskRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ error: "La tarea no existe o no se ha encontrado." });
      }

      const note = await notesRepository.findById(existing.note_id, userId);
      if (!note) {
        return res.status(403).json({ error: "No tienes permiso para modificar esta tarea." });
      }

      const updatedTask = await taskRepository.update(id, {
        is_completed: !existing.is_completed,
      });

      return res.json(updatedTask);
    } catch (error) {
      console.error('Error completando la tarea.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const existing = await taskRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ error: "La tarea no existe o no se ha encontrado." });
      }

      const note = await notesRepository.findById(existing.note_id, userId);
      if (!note) {
        return res.status(403).json({ error: "No tienes permiso para modificar esta tarea." });
      }

      await taskRepository.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error eliminando la tarea.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },
};
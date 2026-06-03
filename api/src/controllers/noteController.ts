import { Request, Response } from "express";
import { notesRepository } from "@/repositories/notesRepository";
import { getErrorMessage } from "@/lib/errors";

export const notesController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const search = req.query.search as string | undefined;
      const folderId = req.query.folderId as string | undefined;

      const notes = await notesRepository.findAll(userId, search, folderId);
      return res.json(notes);

    } catch (error) {
      console.error("Error obteniendo las notas.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const notes = await notesRepository.findById(id, userId);
      if (!notes) {
        return res.status(400).json({ error: "Error encontrando la nota." })
      }

      return res.json(notes);
    } catch (error) {
      console.error("Error encontrando la nota.");
      return res.json(500).json({ error: getErrorMessage(error) })
    }
  },

  getPinned: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const notes = await notesRepository.findPinned(userId);
      return res.json(notes);

    } catch (error) {
      console.error('Error en getPinned:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getArchived: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const notes = await notesRepository.findArchived(userId);
      return res.json(notes);

    } catch (error) {
      console.error('Error en getArchived:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getDeleted: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const notes = await notesRepository.findDeleted(userId);
      return res.json(notes);

    } catch (error) {
      console.error('Error en getDeleted:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { title, content, color, folder_id } = req.body;

      const notes = await notesRepository.create({
        user_id: userId,
        title: title,
        content: content,
        color: color,
        folder_id: folder_id ?? null,
      });

      return res.status(201).json(notes);

    } catch (error) {
      console.error("Error creando la nota.")
      return res.status(500).json({ error: getErrorMessage(error) })
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.body;
      const userId = req.user!.id;
      const { title, content, color, folder_id, is_pinned, is_archived } = req.body;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: "No se ha encontrado la nota." });
      }

      const updated = await notesRepository.update(id, {
        title,
        content,
        color,
        folder_id,
        is_pinned,
        is_archived,
      });

      return res.json(updated);
    } catch (error) {
      console.error("Error actualizando la nota.", error);
      return res.status(500).json({ error: getErrorMessage(error) })
    }
  },

  pin: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      const updated = await notesRepository.update(id, {
        is_pinned: !existing.is_pinned,
      });

      return res.json(updated);

    } catch (error) {
      console.error('Error en pin note:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  archive: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      const updated = await notesRepository.update(id, {
        is_archived: !existing.is_archived,
      });

      return res.json(updated);

    } catch (error) {
      console.error('Error en archive note:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  softDelete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      const updated = await notesRepository.update(id, {
        is_deleted: true,
      });

      return res.json(updated);

    } catch (error) {
      console.error('Error en softDelete note:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  restore: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      const updated = await notesRepository.update(id, {
        is_deleted: false,
      });

      return res.json(updated);

    } catch (error) {
      console.error('Error en restore note:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  hardDelete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await notesRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      await notesRepository.hardDelete(id);
      return res.status(204).send();

    } catch (error) {
      console.error('Error en hardDelete note:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },
}
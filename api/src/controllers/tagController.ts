import { Request, Response } from 'express';
import { tagRepository } from '@/repositories/tagRepository';
import { notesRepository } from '@/repositories/notesRepository';
import { getErrorMessage } from '@/lib/errors';

export const tagController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const tags = await tagRepository.findAll(userId);
      return res.json(tags);
    } catch (error) {
      console.error("Error obteniendo todos los tags.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const tag = await tagRepository.findById(id, userId);
      if (!tag) {
        return res.status(404).json({ error: "No se ha encontrado el tag." });
      }

      return res.json(tag);
    } catch (error) {
      console.error("Error obteniendo el tag.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  getByNote: async (req: Request<{ noteId: string }>, res: Response) => {
    try {
      const { noteId } = req.params;
      const userId = req.user!.id;

      const note = await notesRepository.findById(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: "Nota no encontrada." });
      }

      const tag = await tagRepository.findByNote(noteId);
      return res.json(tag);
    } catch (error) {
      console.error('Error obteniendo los tags de la nota.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ error: "El nombre del tag es obligatorio." });
      }

      const createdTag = await tagRepository.create({
        user_id: userId,
        name,
        color,
      })

      return res.json(createdTag);
    } catch (error) {
      console.error("Error creando el tag.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, color } = req.body;

      const existing = await tagRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: "El tag no existe o no se ha encontrado." });
      }

      const updatedTag = await tagRepository.update(id, { name, color });
      return res.json(updatedTag);
    } catch (error) {
      console.error('Error actualizando el tag.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await tagRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: "El tag no existe o no se ha encontrado" });
      }

      await tagRepository.delete(id)
      return res.status(204).send();

    } catch (error) {
      console.error("Error eliminando el tag.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  addToNote: async (req: Request<{ noteId: string, tagId: string }>, res: Response) => {
    try {
      const { noteId, tagId } = req.params;
      const userId = req.user!.id;

      const note = await notesRepository.findById(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada.' });
      }

      const tag = await tagRepository.findById(tagId, userId);
      if (!tag) {
        return res.status(404).json({ error: "Tag no encontrado" })
      }

      await tagRepository.addToNote(noteId, tagId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error añadiendo tag a la nota.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  removeFromNote: async (req: Request<{ noteId: string, tagId: string }>, res: Response) => {
    try {
      const { noteId, tagId } = req.params;
      const userId = req.user!.id;

      const note = await notesRepository.findById(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: "Nota no encontrada" });
      }

      await tagRepository.removeFromNote(noteId, tagId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error quitando tag de la nota.', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  }
};
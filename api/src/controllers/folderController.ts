import { Response, Request } from 'express';
import { folderRepository } from '@/repositories/folderRepository';
import { getErrorMessage } from '@/lib/errors';

export const folderController = {
   // Obtener todas las carpetas
  findAll: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const folder = await folderRepository.findAll(userId);
      return res.json(folder);

    } catch (error) {
      console.error("Error obteniendo las carpetas.", error)
      return res.status(500).json({ error: getErrorMessage(error) })
    }
  },

  findById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const folder = await folderRepository.findById(id, userId);

      if (!folder) {
        return res.status(404).json({ error: "Carpeta no encontrada." });
      }
      return res.json(folder);
    } catch (error) {
      console.error("Error obteniendo el ID de carpeta.", error)
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, color, icon, position } = req.body;

      if (!name) {
        return res.status(400).json({ error: "El nombre de la carpeta es obligatorio." });
      }
      
      const folder = await folderRepository.create({
        user_id: userId,
        name,
        color,
        icon,
        position
      })
      
      return res.json(folder);
    } catch (error) {
      console.error("Error creando la carpeta.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, color, icon, position } = req.body;

      const existing = await folderRepository.findById(id, userId);
      if (!existing) { 
        return res.status(404).json({ error: "La carpeta no existe." });
      }

      const folderUpdated = await folderRepository.update(id, {
        name,
        color,
        icon,
        position,
      });

      return res.json(folderUpdated);
    } catch (error) {
      console.error("Error actualizando la carpeta.", error);
      return res.status(500).json({ error: getErrorMessage(error) })
    }
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const existing = await folderRepository.findById(id, userId);
      if (!existing) {
        return res.status(404).json({ error: "La carpeta no existe o no se ha encontrado." });
      }

      await folderRepository.delete(id)
      return res.status(204).send();
    } catch (error) {
      console.error("Error eliminando la carpeta.", error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  }
}
import { Request, Response } from "express";
import { userRepository } from '@/repositories/userRepository';

export const userController = {

   // Registro del perfil
  create: async (req: Request, res: Response) => {
    const { id, username, email } = req.body;

    try {
       // Obtiene los datos del perfil y lo crea
      const user = await userRepository.create({
        id,
        username,
        email
      });

      return res.status(201).json({
        message: "Perfil creado con exito",
        user
      });
    } catch (error) {
      console.error("Error creando el usuario", error);
       // Se asegura de que el error sea del objeto Error
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({ error: "Error creando el usuario" })
    }
  },

   // Obtener el perfil
  getMe: async (req: Request, res: Response) => {
    try {
      const supabaseId = req.user!.id
      const user = await userRepository. findById(supabaseId);

      if (!user) {
        return res.status(404).json({ error: "El perfil no se ha encontrado en la base de datos." })
      }

      return res.json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error obteniendo los datos del usuario" });
    } 
  },

   // Actualizar el perfil
  updateMe: async (req: Request, res: Response) => {
    try {
      const supabaseId = req.user!.id;

      const existingUser = await userRepository.findById(supabaseId);
      if (!existingUser) {
        return res.status(404).json({ error: "No se ha encontrado el usuario." })
      }

      const updatedUser = await userRepository.update(supabaseId, req.body);

      return res.json({
        message: "Perfil actualizado con éxito.",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error actualizando el usuario", error);

      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({ error: "Error actualizando el usuario." });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Error al obtener usuario." });
    }
  }
}
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

   // Obtener perfil a través del ID
  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Error al obtener usuario." });
    }
  },

   // Obtener email a través del 'username'
  getEmailByUsername: async (req: Request<{ username: string }>, res: Response) => {
    try {
      const { username } = req.params;

      const user = await userRepository.findByUsername(username);
      if (!user) return res.status(404).json({ error: "Nombre de usuario no encontrado." });
      return res.json({ email: user.email });
    } catch (error) {
      console.error("Error buscando email por username: ", error);
      return res.status(500).json({ error: "Error al buscar el email." })
    }
  },

   // Comprobar que el email existe
  checkEmailExists: async (req: Request, res: Response) => {
    try {
      const email = (req.query.email as string) ?? '';
      if (!email) res.status(400).json({ error: "Email requerido." });
      const exists = await userRepository.existsByEmail(email);
      return res.json({ exists })
    } catch (error) {
      console.error("Error al verificar el correo.", error);
      return res.status(500).json({ error: "Error al verificar el correo." })
    }
  }
}
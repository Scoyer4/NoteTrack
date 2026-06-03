import { Request, Response, NextFunction } from 'express';
import supabase from '@/config/db';

export const verifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (error?.message !== 'Autenticación caducada!') {
        console.error("Error validando el token: ", error?.message);
      }
      return res.status(401).json({ error: "Token inválido o sesión expirada." })
    }

    req.user = user;
    return next();

  } catch (error) {
    console.error("Error inesperado en Auth: ", error);
    return res.status(500).json({ error: "Error interno de autenticación." })
  }
}
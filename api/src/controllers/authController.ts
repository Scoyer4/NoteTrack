import { Request, Response } from 'express';
import supabase from '../config/db';
import { getErrorMessage } from '../lib/errors';

export const authController = {

  register: async (req: Request, res: Response) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, contraseña y username son obligatorios.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({
        message: 'Registro completado. Revisa tu email para confirmar la cuenta.',
        user: data.user
      });

    } catch (error) {
      console.error('Error en register:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son obligatorios.'
      });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }

      return res.status(200).json({
        message: 'Sesión iniciada correctamente.',
        session: {
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at:    data.session.expires_at,
        },
        user: data.user
      });

    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  },

  logout: async (req: Request, res: Response) => {
    return res.status(200).json({
      message: 'Sesión cerrada correctamente.'
    });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio.' });
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CLIENT_URL}/reset-password`
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        message: 'Si ese correo está registrado recibirás un email en breve.'
      });

    } catch (error) {
      console.error('Error en forgotPassword:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  }

};
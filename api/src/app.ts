import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import config from '@/config'

import type { CorsOptions } from 'cors';

const app = express();

const allowedOrigins = ['http://localhost:5173'];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || config.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

 // Rutas
import authRoutes from '@/routes/authRoutes';

app.use("/api/auth", authRoutes);


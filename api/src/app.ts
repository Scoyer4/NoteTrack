import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import type { CorsOptions } from 'cors';

dotenv.config();

const app = express();
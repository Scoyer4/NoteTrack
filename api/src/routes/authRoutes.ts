import { Router } from 'express';
import { authController } from '../controllers/authController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.post('/logout',          verifyAuth, authController.logout);
router.post('/forgot-password', authController.forgotPassword);

export default router;
import { Router } from 'express';
import { notesController } from '../controllers/noteController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Todas las rutas de notas requieren autenticación
router.use(verifyAuth);

// Obtener notas
router.get('/', notesController.getAll);
router.get('/pinned', notesController.getPinned);
router.get('/archived', notesController.getArchived);
router.get('/deleted', notesController.getDeleted);
router.get('/:id', notesController.getById);

// Crear
router.post('/', notesController.create);

// Editar
router.patch('/:id', notesController.update);
router.patch('/:id/pin', notesController.pin);
router.patch('/:id/archive', notesController.archive);
router.patch('/:id/delete', notesController.softDelete);
router.patch('/:id/restore', notesController.restore);

// Borrado permanente
router.delete('/:id', notesController.hardDelete);

export default router;
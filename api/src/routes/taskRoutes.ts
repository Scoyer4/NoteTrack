import { Router } from "express";
import { verifyAuth } from "@/middlewares/auth";
import { taskController } from '@/controllers/taskController';

const router = Router();

router.use(verifyAuth);

router.get("/upcoming", taskController.getUpcoming);

router.get("/note/:noteId", taskController.getByNote);
router.post("/note/:noteId", taskController.create);

router.patch("/:id", taskController.update);
router.patch("/:id", taskController.toggleComplete);
router.delete("/:id", taskController.delete);

export default router;
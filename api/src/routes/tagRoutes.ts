import { Router } from "express";
import { tagController } from "@/controllers/tagController";
import { verifyAuth } from "@/middlewares/auth";

const router = Router();

router.use(verifyAuth);

router.get("/", tagController.getAll);
router.get("/note/:noteId", tagController.getByNote);
router.get("/:id", tagController.getById);

router.post("/", tagController.create);
router.post("/note/:noteId/:tagId", tagController.addToNote);

router.patch("/:id", tagController.update);

router.delete("/:id", tagController.delete);
router.delete("/note/:noteId/:tagId", tagController.removeFromNote);

export default router;
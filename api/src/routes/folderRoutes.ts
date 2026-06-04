import { Router } from "express";
import { folderController } from "@/controllers/folderController";
import { verifyAuth } from "@/middlewares/auth";

const router = Router();

router.use(verifyAuth);

router.get("/", folderController.findAll);
router.get("/:id", folderController.findById);

router.post("/", folderController.create);

router.patch("/:id", folderController.update);
router.delete("/:id", folderController.delete);

export default router;
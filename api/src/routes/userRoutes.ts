import { Router } from "express";
import { userController } from "@/controllers/userController";
import { verifyAuth } from "@/middlewares/auth";

const router = Router();

router.post("/", userController.create);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);

router.get("/:id", userController.getById);
router.get("/email/:username", userController.getEmailByUsername);
router.post("/check-email", userController.checkEmailExists);

export default router;
import { Router } from "express";
import * as authController from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.post("/", authController.createUser);
router.post("/sessions", authController.sessions);
router.post("/tokens", authController.createToken);

router.delete("/sessions", authenticate, authController.destroySession);

router.patch(
  "/profile",
  authenticate,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  authController.updateProfile,
);

export default router;

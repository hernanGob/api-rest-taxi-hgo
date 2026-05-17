import { Router } from "express";
import type { UserController } from "./admin.controller.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";

export const UserRoutes = (userController: UserController) => {
    const router = Router();

    router.post("/login", userController.login.bind(userController));
    router.get("/session", authenticateTokenWeb, userController.verifySession.bind(userController));

    return router;
};
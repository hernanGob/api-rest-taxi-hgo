import { Router } from "express";

import type {
    UserController,
} from "./admin.controller.js";

export const UserRoutes = (
    userController: UserController,
) => {
    const router = Router();

    router.post(
        "/login",
        userController.login,
    );

    /*
     * Para usuarios que todavía no han configurado 2FA.
     */
    router.post(
        "/setup-2fa",
        userController.setupTwoFactor,
    );

    router.post(
        "/setup-2fa/verify",
        userController.verifyTwoFactorSetup,
    );

    /*
     * Para usuarios que ya tienen 2FA configurado.
     */
    router.post(
        "/login/verify-2fa",
        userController.loginVerifyTwoFactor,
    );

    router.get(
        "/session",
        userController.verifySession,
    );

    router.delete(
        "/logout",
        userController.logout,
    );

    router.delete(
        "/logout-all",
        userController.logoutAll,
    );

    router.delete(
        "/reset-2fa",
        userController.resetTwoFactor,
    );

    return router;
};
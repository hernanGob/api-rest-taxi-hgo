import { Router } from "express";
import type { DriverAuthController } from "./driverAuth.controller.js";
import { authenticateOperador } from "../../middleware/operadorMiddleware.js";

export const DriverAuthRoutes = (
    driverAuthController: DriverAuthController
) => {
    const router = Router();

    router.post(
        "/check",
        driverAuthController.checkDriver.bind(driverAuthController)
    );

    router.post(
        "/set-password",
        driverAuthController.setPassword.bind(driverAuthController)
    );

    router.post(
        "/login",
        driverAuthController.login.bind(driverAuthController)
    );

    router.get('/session', authenticateOperador, driverAuthController.session.bind(driverAuthController));

    return router;
};

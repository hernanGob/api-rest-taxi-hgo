import { Router } from "express";
import type { DriverController } from "./driver.controller.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";

export const DriverRoutes = (driverController: DriverController) => {
    const router = Router();

    router.get('/all', authenticateTokenWeb, driverController.listDrivers);
    router.get('/drivers/:id', authenticateTokenWeb, driverController.getDriverById);
    router.get('/search', authenticateTokenWeb, driverController.getDriverByFullNameQuery.bind(driverController));

    return router;
};
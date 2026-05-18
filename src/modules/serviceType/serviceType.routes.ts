import { Router } from "express";
import type { ServiceTypeController } from "./serviceType.controller.js";

export const ServiceTypeRoutes = (
    serviceTypeController: ServiceTypeController
) => {
    const router = Router();

    router.get(
        "/",
        serviceTypeController.listServiceTypes.bind(serviceTypeController)
    );

    return router;
};
import { Router } from "express";
import type { PricingController } from "./pricing.controller.js";

export const PricingRoutes = (pricingController: PricingController) => {
    const router = Router();

    // ADMIN - Listar configuraciones de tarifas
    router.get(
        "/admin/pricing-configs",
        pricingController.listPricingConfigs.bind(pricingController)
    );

    // ADMIN - Crear configuración de tarifa
    router.post(
        "/admin/pricing-configs",
        pricingController.createPricingConfig.bind(pricingController)
    );

    // ADMIN - Actualizar configuración de tarifa
    router.patch(
        "/admin/pricing-configs/:id",
        pricingController.updatePricingConfig.bind(pricingController)
    );

    // APP/PUBLIC - Resolver tarifa efectiva por municipio
    router.get(
        "/pricing/resolve",
        pricingController.resolvePricing.bind(pricingController)
    );

    // APP/PUBLIC - Obtener tarifa global activa
    router.get(
        "/global",
        pricingController.getGlobalPricing.bind(pricingController)
    );

    return router;
};
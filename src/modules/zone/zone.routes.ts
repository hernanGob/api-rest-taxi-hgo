import { Router } from "express";
import type { ZoneController } from "./zone.controller.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";

export const ZoneRoutes = (zoneController: ZoneController) => {
    const router = Router();

    router.get(
        "/admin/zones",
        authenticateTokenWeb,
        zoneController.listZones.bind(zoneController)
    );

    router.post(
        "/admin/zones",
        authenticateTokenWeb,
        zoneController.createZone.bind(zoneController)
    );

    router.patch(
        "/admin/zones/:id",
        authenticateTokenWeb,
        zoneController.updateZone.bind(zoneController)
    );

    router.patch(
        "/admin/zones/:id/active",
        authenticateTokenWeb,
        zoneController.setZoneActive.bind(zoneController)
    );

    router.get(
        "/admin/municipalities",
        authenticateTokenWeb,
        zoneController.listMunicipalities.bind(zoneController)
    );

    router.patch(
        "/admin/municipalities/:id/zone",
        authenticateTokenWeb,
        zoneController.setMunicipalityZone.bind(zoneController)
    );

    router.patch(
        "/admin/zones/:id/municipalities",
        authenticateTokenWeb,
        zoneController.bulkAssignMunicipalitiesToZone.bind(zoneController)
    );

    return router;
};
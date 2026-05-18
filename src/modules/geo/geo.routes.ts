import { Router } from "express";
import type { GeoController } from "./geo.controller.js";

export const GeoRoutes = (geoController: GeoController) => {
    const router = Router();

    // ADMIN - Listar zonas
    router.get(
        "/admin/zones",
        geoController.listZones.bind(geoController)
    );

    // ADMIN - Listar municipios
    router.get(
        "/admin/municipalities",
        geoController.listMunicipalities.bind(geoController)
    );

    // APP/PUBLIC - Buscar ubicación con Google Geocoding
    router.get(
        "/find-location",
        geoController.findLocation.bind(geoController)
    );

    // APP/PUBLIC - Obtener distancia, tiempo y polyline de una ruta
    router.get(
        "/route",
        geoController.routeInfo.bind(geoController)
    );

    router.get(
        "/municipality-by-coordinates",
        geoController.getMunicipalityByCoordinates.bind(geoController)
    );

    return router;
};
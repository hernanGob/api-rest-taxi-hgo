import { type Request, type Response, type NextFunction } from "express";
import type { GeoService } from "./geo.service.js";
import type { MunicipalityFilters } from "./geo.types.js";

export class GeoController {
    constructor(private readonly geoService: GeoService) { }

    async listZones(req: Request, res: Response, next: NextFunction) {
        try {
            const active =
                typeof req.query.active === "string"
                    ? req.query.active === "true"
                    : undefined;

            const result = await this.geoService.listZones(active);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async listMunicipalities(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: MunicipalityFilters = {};

            if (typeof req.query.zoneId === "string") {
                filters.zoneId = req.query.zoneId;
            }

            if (typeof req.query.active === "string") {
                filters.active = req.query.active === "true";
            }

            const result = await this.geoService.listMunicipalities(filters);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async findLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.geoService.findLocation(req.query.q, {
                region: "mx",
                language: "es",
                components: "country:MX",
                limit: 5,
            });

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async routeInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.geoService.getRouteInfo({
                originLat: Number(req.query.originLat),
                originLng: Number(req.query.originLng),
                destLat: Number(req.query.destLat),
                destLng: Number(req.query.destLng),
            });

            return res.status(200).json({
                status: "success",
                msg: "Ruta calculada",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMunicipalityByCoordinates(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);
            const result = await this.geoService.getMunicipalityByCoordinates(lat, lng);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAddressByCoordinates(req: Request, res: Response) {
        try {
            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);

            if (!lat || !lng) {
                return res.status(400).json({
                    status: "error",
                    msg: "Coordenadas inválidas",
                });
            }

            const address = await this.geoService.getAddressByCoords(lat, lng);

            return res.status(200).json({
                status: "success",
                msg: "Dirección obtenida correctamente",
                data: {
                    address,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                msg: "No se pudo obtener la dirección",
            });
        }
    }
}
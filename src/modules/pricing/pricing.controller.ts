import { type Request, type Response, type NextFunction } from "express";
import type { PricingService } from "./pricing.service.js";
import type {
    PricingConfigDto,
    PricingConfigFilters,
    PricingConfigUpdateDto,
    PricingScope,
} from "./pricing.types.js";

export class PricingController {
    constructor(private readonly pricingService: PricingService) { }

    async listPricingConfigs(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query;

            const filters: PricingConfigFilters = {};

            if (typeof query.scope === "string") {
                filters.scope = query.scope as PricingScope;
            }

            if (typeof query.zoneId === "string") {
                filters.zoneId = query.zoneId;
            }

            if (typeof query.municipalityId === "string") {
                filters.municipalityId = query.municipalityId;
            }

            if (typeof query.active === "string") {
                filters.active = query.active === "true";
            }

            const result = await this.pricingService.listPricingConfigs(filters);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createPricingConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;

            const data: PricingConfigDto = {
                scope: body.scope,
                zoneId: body.zoneId ?? body.zone_id ?? null,
                municipalityId: body.municipalityId ?? body.municipality_id ?? null,
                baseFare: Number(body.baseFare ?? body.base_fare),
                perMinute: Number(body.perMinute ?? body.per_minute),
                perKm: Number(body.perKm ?? body.per_km),
                isActive: body.isActive ?? body.is_active ?? true,
            };

            const result = await this.pricingService.createPricingConfig(data);

            return res.status(201).json({
                status: "success",
                msg: "Configuración de tarifa creada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePricingConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const idRaw = req.params.id;

            const id = typeof idRaw === "string" ? idRaw : "";

            if (!id) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const body = req.body;
            const patch: PricingConfigUpdateDto = {};

            if (body.baseFare !== undefined) {
                patch.baseFare = Number(body.baseFare);
            }

            if (body.perMinute !== undefined) {
                patch.perMinute = Number(body.perMinute);
            }

            if (body.perKm !== undefined) {
                patch.perKm = Number(body.perKm);
            }

            if (body.isActive !== undefined) {
                patch.isActive = body.isActive === true || body.isActive === "true";
            }

            const result = await this.pricingService.updatePricingConfig(id, patch);

            return res.status(200).json({
                status: "success",
                msg: "Configuración de tarifa actualizada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async resolvePricing(req: Request, res: Response, next: NextFunction) {
        try {
            const municipalityId = String(req.query.municipalityId ?? "");

            const result = await this.pricingService.resolvePricing(municipalityId);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getGlobalPricing(_req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.pricingService.getGlobalPricing();

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
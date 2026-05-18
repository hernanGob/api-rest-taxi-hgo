import { type Request, type Response, type NextFunction } from "express";
import type { ZoneService } from "./zone.service.js";
import type { MunicipalityFilters } from "./zone.types.js";

export class ZoneController {
    constructor(private readonly zoneService: ZoneService) { }

    async listZones(req: Request, res: Response, next: NextFunction) {
        try {
            const active =
                typeof req.query.active === "string"
                    ? req.query.active === "true"
                    : undefined;

            const result = await this.zoneService.listZones(
                active === undefined ? {} : { active }
            );

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async createZone(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.zoneService.createZone({
                name: req.body.name,
                isActive: req.body.isActive ?? req.body.is_active ?? true,
            });

            return res.status(201).json({
                status: "success",
                msg: "Zona creada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateZone(req: Request, res: Response, next: NextFunction) {
        try {
            const idRaw = req.params.id;
            const id = typeof idRaw === "string" ? idRaw : "";

            if (!id) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const result = await this.zoneService.updateZone(id, {
                name: req.body.name,
                isActive: req.body.isActive ?? req.body.is_active,
            });

            return res.status(200).json({
                status: "success",
                msg: "Zona actualizada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async setZoneActive(req: Request, res: Response, next: NextFunction) {
        try {
            const idRaw = req.params.id;
            const id = typeof idRaw === "string" ? idRaw : "";

            if (!id) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const isActive = req.body.isActive ?? req.body.is_active;

            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    status: "error",
                    msg: "isActive debe ser true o false",
                });
            }

            const result = await this.zoneService.setZoneActive(id, isActive);

            return res.status(200).json({
                status: "success",
                msg: "Estatus de zona actualizado correctamente",
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

            const result = await this.zoneService.listMunicipalities(filters);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async setMunicipalityZone(req: Request, res: Response, next: NextFunction) {
        try {
            const idRaw = req.params.id;
            const id = typeof idRaw === "string" ? idRaw : "";

            if (!id) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const result = await this.zoneService.setMunicipalityZone(id, {
                zoneId: req.body.zoneId ?? req.body.zone_id ?? null,
            });

            return res.status(200).json({
                status: "success",
                msg: "Zona del municipio actualizada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async bulkAssignMunicipalitiesToZone(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const idRaw = req.params.id;
            const zoneId = typeof idRaw === "string" ? idRaw : "";

            if (!zoneId) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const result = await this.zoneService.bulkAssignMunicipalitiesToZone(
                zoneId,
                {
                    municipalityIds: req.body.municipalityIds ?? req.body.municipality_ids,
                    sync: req.body.sync ?? false,
                }
            );

            return res.status(200).json({
                status: "success",
                msg: "Municipios asignados correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
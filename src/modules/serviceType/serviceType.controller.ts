import { type Request, type Response, type NextFunction } from "express";
import type { ServiceTypeService } from "./serviceType.service.js";

export class ServiceTypeController {
    constructor(private readonly serviceTypeService: ServiceTypeService) { }

    async listServiceTypes(_req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.serviceTypeService.listServiceTypes();

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
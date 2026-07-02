import { type Request, type Response, type NextFunction } from "express";
import type { DriverAuthService } from "./driverAuth.service.js";
import { ConsoleLogWriter } from "drizzle-orm";

export class DriverAuthController {
    constructor(private readonly driverAuthService: DriverAuthService) { }

    async checkDriver(req: Request, res: Response, next: NextFunction) {
        try {
            const idoperador = Number(req.body.idoperador);

            const result = await this.driverAuthService.checkDriver(idoperador);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async setPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.driverAuthService.setPassword({
                idoperador: Number(req.body.idoperador),
                password: req.body.password,
                confirmPassword: req.body.confirmPassword,
            });

            return res.status(200).json({
                status: "success",
                msg: "Contraseña creada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.driverAuthService.login({
                idoperador: Number(req.body.idoperador),
                password: req.body.password,
            });

            return res.status(200).json({
                status: "success",
                msg: "Inicio de sesión correcto",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
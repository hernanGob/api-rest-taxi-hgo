import type { Request, Response, NextFunction } from "express";
import type { DriverService } from "./driver.service.js";

export class DriverController {
    constructor(
        private readonly driverService: DriverService
    ) { }

    listDrivers = async (req: Request, res: Response) => {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        const r = await this.driverService.listDrivers(page, limit);

        return res.status(r.statusCode).json({
            ok: r.ok,
            status: r.status,
            msg: r.msg,
            data: r.data,
            page: r.page,
            limit: r.limit,
            total: r.total,
            totalPages: r.totalPages,
        });
    };

    getDriverById = async (req: Request, res: Response) => {
        try {
            const idoperador = Number(req.params.id);

            if (!idoperador || isNaN(idoperador)) {
                return res.status(400).json({
                    ok: false,
                    msg: "ID inválido",
                });
            }

            const driver = await this.driverService.findDriverById(idoperador);

            if (!driver) {
                return res.status(404).json({
                    ok: false,
                    msg: `Conductor con ID ${idoperador} no encontrado`,
                });
            }

            return res.status(200).json({
                ok: true,
                data: driver,
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    };

    getDriverByIdQuery = async (req: Request, res: Response) => {
        try {
            const idoperador = Number(req.query.idoperador);

            if (!idoperador || isNaN(idoperador)) {
                return res.status(400).json({
                    ok: false,
                    msg: "Se requiere el parámetro 'idoperador' como número válido",
                });
            }

            const driver = await this.driverService.findDriverById(idoperador);

            if (!driver) {
                return res.status(404).json({
                    ok: false,
                    msg: `Conductor con ID ${idoperador} no encontrado`,
                });
            }

            return res.status(200).json({
                ok: true,
                data: driver,
            });
        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    };

    getDriverByFullNameQuery = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const nombre = String(req.query.nombre ?? "").trim();
            const apellidopaterno = String(req.query.apellidopaterno ?? "").trim();
            const apellidomaterno = String(req.query.apellidomaterno ?? "").trim();
            const pagina = Number(req.query.pagina ?? 1);
            const limite = Number(req.query.limite ?? 10);

            if (!nombre) {
                return res.status(400).json({
                    ok: false,
                    msg: "El parámetro nombre es obligatorio",
                });
            }

            const driver = await this.driverService.findDriverByFullName(nombre, apellidopaterno, apellidomaterno, pagina, limite);
            if (!driver) {
                return res.status(404).json({
                    ok: false,
                    msg: `Conductor no encontrado`,
                });
            }

            return res.status(200).json({
                status: 'success',
                data: driver,
            });
        } catch (error) {
            next(error)
        }
    }
}
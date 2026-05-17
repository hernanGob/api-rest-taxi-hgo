import type { Request, Response, NextFunction } from "express";
import type { emergencyContactService } from "./emergencyContact.service.js";
import type { EmergencyContactDto } from "./emergencyContact.types.js";
import {
    validateEmergencyContactBody,
    validateUUID,
    validateEmailParam,
} from "./emergencyContact.validation.js";

export class EmergencyContactController {
    constructor(
        private readonly emergencyContactService: emergencyContactService
    ) { }

    async createEmergencyContact(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) {
                return res.json({
                    status: 'error',
                    masg: 'Cuerpo de la solicitud requerido'
                });
            }
            const body = req.body;

            const errors = validateEmergencyContactBody(body);

            if (errors.length > 0) {
                return res.json({
                    status: "error",
                    msg: "Datos no válidos",
                    errors,
                });
            }

            const data: EmergencyContactDto = {
                name: body.name,
                paternalSurname: body.paternalSurname,
                maternalSurname: body.maternalSurname,
                email: body.email.trim().toLowerCase(),
                phone: body.phone,
            }

            const result = await this.emergencyContactService.create(data);

            return res.json({
                status: 'success',
                masg: 'Contacto de emergencia generado correctamente'
            });

        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params) {
                return res.json({
                    status: 'error',
                    masg: 'Parámetro faltante'
                });
            }
            const { id } = req.params

            if (!validateUUID(id) || !id || Array.isArray(id)) {
                return res.status(400).json({
                    status: "error",
                    msg: "Parámetro no válido",
                });
            }

            const result = await this.emergencyContactService.getById(id);

            return res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getByEmail(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params) {
                return res.json({
                    status: 'error',
                    masg: 'Parámetro faltante'
                });
            }
            const { email } = req.params

            if (!email || Array.isArray(email)) {
                return res.json({
                    status: 'error',
                    masg: 'Parámetro no válido'
                });
            }

            if (!validateEmailParam(email)) {
                return res.status(400).json({
                    status: "error",
                    msg: "Correo electrónico no válido",
                });
            }

            const result = await this.emergencyContactService.getByEmail(email);

            return res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) {
                return res.json({
                    status: 'error',
                    masg: 'Cuerpo de la solicitud requerido'
                });
            }
            const body = req.body;

            const errors = validateEmergencyContactBody(body, true);

            if (errors.length > 0) {
                return res.json({
                    status: "error",
                    msg: "Datos no válidos",
                    errors,
                });
            }

            const data: EmergencyContactDto = {
                id: body.id,
                name: body.name,
                paternalSurname: body.paternalSurname,
                maternalSurname: body.maternalSurname,
                email: body.email.trim.toLowerCase(),
                phone: body.phone,
            }

            const result = await this.emergencyContactService.update(data);

            return res.json({
                status: 'success',
                masg: 'Contacto de emergencia modificado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params) {
                return res.json({
                    status: 'error',
                    masg: 'Parámetro faltante'
                });
            }
            const { id } = req.params

            if (!id || Array.isArray(id) || !validateUUID(id)) {
                return res.json({
                    status: 'error',
                    masg: 'Parámetro no válido'
                });
            }
            const result = await this.emergencyContactService.getById(id);

            return res.json({
                status: 'success',
                msg: 'Contacto de emergencia eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }
}
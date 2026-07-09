import { type Request, type Response, type NextFunction } from "express";
import type { PassengerService } from "./passenger.service.js";
import {
    validatePassengerRegisterBody,
    validatePassengerLoginBody,
} from "./passenger.validation.js";

export class PassengerController {
    constructor(
        private readonly passengerService: PassengerService
    ) { }

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;

            const errors = validatePassengerRegisterBody(body);

            if (errors.length > 0) {
                return res.status(400).json({
                    status: "error",
                    msg: errors.join("\n"),
                });
            }

            const passengerData = {
                name: body.name.trim(),
                paternalSurname: body.paternalSurname.trim(),
                maternalSurname: body.maternalSurname.trim(),
                phone: body.phone.trim(),
                email: body.email.trim().toLowerCase(),
                password: body.password,
                dateOfBirth: body.dateOfBirth,
                emergencyContactId: body.emergencyContactId ?? null,
            };

            const emergencyContactData = body.addEmergencyContact
                ? {
                    name: body.emergencyContact.name.trim(),
                    paternalSurname: body.emergencyContact.paternalSurname.trim(),
                    maternalSurname: body.emergencyContact.maternalSurname.trim(),
                    phone: body.emergencyContact.phone.trim(),
                    email: body.emergencyContact.email.trim().toLowerCase(),
                }
                : null;

            const result = await this.passengerService.register(
                passengerData,
                emergencyContactData,
                Boolean(body.addEmergencyContact)
            );

            return res.status(201).json({
                status: "success",
                msg: "Cuenta creada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;

            const errors = validatePassengerLoginBody(body);

            if (errors.length > 0) {
                return res.status(400).json({
                    status: "error",
                    msg: errors.join("\n"),
                });
            }

            const result = await this.passengerService.login(body.email, body.password);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    session(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(404).json({
                    status: 'invalid',
                });
            }

            return res.status(200).json({
                status: 'success',
            });
        } catch (error) {
            next(error);
        }
    }
}
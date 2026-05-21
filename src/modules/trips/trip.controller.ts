import { type Request, type Response, type NextFunction } from "express";
import type { TripService } from "./trip.service.js";
import type { CreateTripDto } from "./trip.types.js";
import { validateCreateTripBody } from "./trip.validation.js";

export class TripController {
    constructor(private readonly tripService: TripService) { }

    async createTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;

            const errors = validateCreateTripBody(body);

            if (errors.length > 0) {
                return res.status(400).json({
                    status: "error",
                    msg: errors.join("\n"),
                });
            }

            const data: CreateTripDto = {
                passengerId: String(body.passengerId),
                origin: {
                    lat: Number(body.origin.lat),
                    lng: Number(body.origin.lng),
                    address: body.origin.address,
                },
                destination: {
                    lat: Number(body.destination.lat),
                    lng: Number(body.destination.lng),
                    address: body.destination.address,
                },
                destinationAddress: body.destinationAddress.trim(),
                distanceKm: Number(body.distanceKm),
                fare: Number(body.fare),
                serviceTypeId: Number(body.serviceTypeId),
                pricingConfigId: body.pricingConfigId ?? null,
            };

            const result = await this.tripService.createTrip(data);

            return res.status(201).json({
                status: "success",
                msg: "Viaje solicitado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTripById(req: Request, res: Response, next: NextFunction) {
        try {
            const idRaw = req.params.id;
            const id = typeof idRaw === "string" ? idRaw : "";

            if (!id) {
                return res.status(400).json({
                    status: "error",
                    msg: "El id es requerido",
                });
            }

            const result = await this.tripService.findTripById(id);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async listTripsByPassenger(req: Request, res: Response, next: NextFunction) {
        try {
            const passengerIdRaw = req.params.passengerId;
            const passengerId = typeof passengerIdRaw === "string" ? passengerIdRaw : "";

            if (!passengerId) {
                return res.status(400).json({
                    status: "error",
                    msg: "El passengerId es requerido",
                });
            }

            const result = await this.tripService.listTripsByPassenger(passengerId);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async listTripHistoryByPassenger(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const passengerIdRaw = req.params.passengerId;
            const passengerId = typeof passengerIdRaw === "string" ? passengerIdRaw : "";

            if (!passengerId) {
                return res.status(400).json({
                    status: "error",
                    msg: "El passengerId es requerido",
                });
            }

            const result = await this.tripService.listTripHistoryByPassenger(passengerId);

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async listRequestedTripsForDriver(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.tripService.listRequestedTripsForDriver();

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async acceptTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.tripService.acceptTrip({
                tripId: req.params.id as string,
                idoperador: Number(req.body.idoperador),
            });

            return res.status(200).json({
                status: "success",
                msg: "Viaje aceptado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async startTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.tripService.startTrip({
                tripId: req.params.id as string,
                idoperador: Number(req.body.idoperador),
                pickupCode: String(req.body.pickupCode),
            });

            return res.status(200).json({
                status: "success",
                msg: "Viaje iniciado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async completeTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.tripService.completeTrip({
                tripId: req.params.id as string,
                idoperador: Number(req.body.idoperador),
            });

            return res.status(200).json({
                status: "success",
                msg: "Viaje completado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
import validator from "validator";
import type { TripRepository } from "./trip.repo.js";
import type { CreateTripDto } from "./trip.types.js";
import { mapTripForApp } from "./trip.mapper.js";
import { GeoService } from "../geo/geo.service.js";
import { mapOperatorTripHistoryForApp } from "./tripHistoryOperator.mapper.js";
import { emitToAvailableTrips, emitToTrip } from "../../socket/socket.service.js";

export class TripService {
    constructor(
        private readonly tripRepository: TripRepository,
        private readonly geoService: GeoService
    ) { }

    private generatePickupCode() {
        return String(Math.floor(10000 + Math.random() * 90000));
    }

    async createTrip(data: any) {
        const DestinationRoutePath = await this.geoService.getRouteInfo(
            {
                originLat: data.origin.lat,
                originLng: data.origin.lng,
                destLat: data.destination.lat,
                destLng: data.destination.lng,
            }
        )

        let dataNewTrip = {
            ...data,
            destinationRoutePath: DestinationRoutePath.path,
        }

        const result = await this.tripRepository.createTrip(dataNewTrip);

        if (!result) {
            throw new Error("No se pudo solicitar el viaje");
        }

        emitToAvailableTrips("new-trip", {
            id: result.id,
            passengerId: result.passengerId,
            idOperador: result.idOperador,

            origin: result.origin,
            destination: result.destination,
            destinationAddress: result.destinationAddress,

            distanceKm: result.distanceKm,
            fare: result.fare,

            tripStatusId: result.tripStatusId,
            serviceTypeId: result.serviceTypeId,

            requestedAt: result.requestedAt,
            acceptedAt: result.acceptedAt,
            startedAt: result.startedAt,
            completedAt: result.completedAt,

            pickupCode: result.pickupCode,
            routeToDestinationPath: result.destinationRoutePath,
        });

        return result;
    }

    async findTripById(id: string) {
        if (!validator.isUUID(id)) {
            throw new Error("El id del viaje no es válido");
        }

        const result = await this.tripRepository.findTripById(id);

        if (!result) {
            throw new Error("Viaje no encontrado");
        }

        return result;
    }

    async listTripsByPassenger(passengerId: string) {
        if (!validator.isUUID(passengerId)) {
            throw new Error("El passengerId no es válido");
        }

        return this.tripRepository.listTripsByPassenger(passengerId);
    }

    async listTripHistoryByPassengerForApp(passengerId: string) {
        if (!validator.isUUID(passengerId)) {
            throw new Error("El passengerId no es válido");
        }

        const rows = await this.tripRepository.listTripHistoryByPassenger(passengerId);

        // Map async: obtiene direcciones legibles para cada TripPoint
        const trips = await Promise.all(rows.map(mapTripForApp));

        return trips;
    }

    async listTripHistoryByPassenger(passengerId: string) {
        if (!validator.isUUID(passengerId)) {
            throw new Error("El passengerId no es válido");
        }

        return this.tripRepository.listTripHistoryByPassenger(passengerId);
    }

    async listRequestedTripsForDriver() {
        return this.tripRepository.listRequestedTripsForDriver();
    }

    async acceptTrip(data: { tripId: string; idoperador: number }) {
        if (!validator.isUUID(data.tripId)) {
            throw new Error("El id del viaje no es válido");
        }

        if (!data.idoperador || !Number.isFinite(data.idoperador)) {
            throw new Error("El idoperador no es válido");
        }

        const code = this.generatePickupCode();

        const result = await this.tripRepository.acceptTrip({
            tripId: data.tripId,
            idoperador: data.idoperador,
            pickupCode: code,
        });

        if (!result) {
            throw new Error("No se pudo aceptar el viaje");
        }

        emitToAvailableTrips('trip-taken', {
            id: result.id,
            idOperador: result.idOperador,
            tripStatusId: result.tripStatusId,
        });

        emitToTrip(result.id, "trip-accepted", {
            id: result.id,
            idOperador: result.idOperador,
            tripStatusId: result.tripStatusId,
            acceptedAt: result.acceptedAt,
            pickupCode: result.pickupCode,
            operator: result.operator,
        });

        return result;
    }

    async startTrip(data: {
        tripId: string;
        idoperador: number;
        pickupCode: string;
    }) {
        if (!validator.isUUID(data.tripId)) {
            throw new Error("El id del viaje no es válido");
        }

        if (!data.pickupCode || !/^\d{5}$/.test(data.pickupCode)) {
            throw new Error("El código debe ser de 5 dígitos");
        }

        const result = await this.tripRepository.startTrip(data);

        if (!result) {
            throw new Error("Código incorrecto o viaje no disponible");
        }

        return result;
    }

    async completeTrip(data: { tripId: string; idoperador: number }) {
        if (!validator.isUUID(data.tripId)) {
            throw new Error("El id del viaje no es válido");
        }

        const result = await this.tripRepository.completeTrip(data);

        if (!result) {
            throw new Error("No se pudo completar el viaje");
        }

        return result;
    }

    async rateTrip(data: { tripId: string; rating: 1 | 2 | 3; comment: string }) {
        if (!validator.isUUID(data.tripId)) {
            throw new Error("El id del viaje no es válido");
        }
        if (![1, 2, 3].includes(data.rating)) {
            throw new Error("El rating debe ser 1, 2 o 3");
        }

        const result = await this.tripRepository.rateTrip(data);

        if (!result) {
            throw new Error("No se pudo calificar el viaje");
        }

        return result;
    }

    async rateTripOperator(data: {
        tripId: string;
        rating: 1 | 2 | 3;
        comment: string;
    }) {
        if (!validator.isUUID(data.tripId)) {
            throw new Error("El id del viaje no es válido");
        }

        if (![1, 2, 3].includes(data.rating)) {
            throw new Error("El rating debe ser 1, 2 o 3");
        }

        const comment = data.comment.trim();

        if (!comment) {
            throw new Error("El comentario es obligatorio");
        }

        if (comment.length < 5) {
            throw new Error("El comentario debe tener al menos 5 caracteres");
        }

        const result = await this.tripRepository.rateTripOperator({
            tripId: data.tripId,
            rating: data.rating,
            comment,
        });

        if (!result) {
            throw new Error("No se pudo calificar el viaje");
        }

        return result;
    }

    async showAllTripsForDashboard() {
        const trips = await this.tripRepository.listAllTrips();

        const data = await Promise.all(
            trips.map(async (trip) => {
                const [originAddress, destinationAddress] = await Promise.all([
                    this.geoService.getAddressByCoords(
                        trip.origin.lat,
                        trip.origin.lng
                    ),
                    this.geoService.getAddressByCoords(
                        trip.destination.lat,
                        trip.destination.lng
                    ),
                ]);

                return {
                    ...trip,
                    origin: {
                        ...trip.origin,
                        address: originAddress || trip.origin.address || "Ubicación actual",
                    },
                    destination: {
                        ...trip.destination,
                        address:
                            destinationAddress ||
                            trip.destination.address ||
                            "Destino no disponible",
                    },
                };
            })
        );

        return data;
    }

    async listTripHistoryByOperator(operatorId: number) {
        const rows = await this.tripRepository.listTripsByOperator(operatorId);

        const trips = await Promise.all(
            rows.map((row) => mapOperatorTripHistoryForApp(row))
        );

        return trips;
    }

    async getActivePassengerTrip(passengerId: string) {
        return await this.tripRepository.getActivePassengerTrip(passengerId);
    }

    async getActiveDriverTrip(operadorId: string) {
        return await this.tripRepository.getActiveDriverTrip(operadorId);
    }

    async cancelTrip(data: {
        tripId: string;
        passengerId: string;
    }) {
        const result = await this.tripRepository.cancelTrip(data);

        if (!result) {
            throw new Error("No se pudo cancelar el viaje o el viaje ya no está disponible");
        }

        emitToTrip(result.id, "trip-cancelled", {
            id: result.id,
            tripStatusId: result.tripStatusId,
            cancelledAt: result.cancelledAt,
        });

        emitToAvailableTrips("trip-cancelled", {
            id: result.id,
            tripStatusId: result.tripStatusId,
        });

        return result;
    }

    async getRequestedTrips() {
        return await this.tripRepository.getRequestedTrips();
    }
}
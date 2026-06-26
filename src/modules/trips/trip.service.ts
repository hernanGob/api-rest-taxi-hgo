import validator from "validator";
import type { TripRepository } from "./trip.repo.js";
import type { CreateTripDto } from "./trip.types.js";
import { mapTripForApp } from "./trip.mapper.js";
import type { GeoService } from "../geo/geo.service.js";

export class TripService {
    constructor(
        private readonly tripRepository: TripRepository,
        private readonly geoService: GeoService
    ) { }

    private generatePickupCode() {
        return String(Math.floor(10000 + Math.random() * 90000));
    }

    async createTrip(data: CreateTripDto) {
        const result = await this.tripRepository.createTrip(data);

        if (!result) {
            throw new Error("No se pudo solicitar el viaje");
        }

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
}
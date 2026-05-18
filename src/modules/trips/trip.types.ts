export type TripPoint = {
    lat: number;
    lng: number;
    address?: string;
};

export interface Trip {
    id: string;
    passengerId: string;
    idOperador: number | null;
    origin: TripPoint;
    destination: TripPoint;
    destinationAddress: string;
    distanceKm: string;
    fare: string;
    tripStatusId: number;
    serviceTypeId: number;
    requestedAt: string | null;
    acceptedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    pickupCode: string | null;
    durationMinutes: number;
    pricingConfigId: string | null;
    passengerRating: number | null;
    driverRating: number | null;
    passengerComment: string | null;
    driverComment: string | null;
}

export interface CreateTripDto {
    passengerId: string;
    origin: TripPoint;
    destination: TripPoint;
    destinationAddress: string;
    distanceKm: number;
    fare: number;
    serviceTypeId: number;
    pricingConfigId?: string | null;
}

export interface ITripRepository {
    createTrip(data: CreateTripDto): Promise<Trip | null>;
    findTripById(id: string): Promise<Trip | null>;
    listTripsByPassenger(passengerId: string): Promise<Trip[]>;
    listTripHistoryByPassenger(passengerId: string): Promise<Trip[]>;
}
import type { OperatorTripHistoryRow } from "./tripHistoryOperator.mapper.js";

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
    operator: {
        idoperador: number;
        nombre: string;
        telefono: string;
    } | null;
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

export interface TripRow {
    id: string;
    passenger_id: string;
    idoperador: number | null;
    origin: TripPoint;              // JSONB en DB
    destination: TripPoint;         // JSONB en DB
    destination_address: string;
    distance_km: string;            // numeric(10,2) en DB -> string
    fare: string;                   // numeric(10,2) en DB -> string
    trip_status_id: number;
    service_type_id: number;
    requested_at: string | null;
    accepted_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    pickup_code: string | null;
    duration_minutes: number;
    pricing_config_id: string | null;
    passenger_rating: number | null;
    driver_rating: number | null;
    passenger_comment: string | null;
    driver_comment: string | null;
}

export interface TripForApp {
    id: string;
    origin: TripPoint;
    destination: TripPoint;
    time: string;
    fare: string;
    rating: number;
    comments: string;
    driverName: string;
    vehicle: string;
    plate: string;
    date: string;
    place: string;
}

interface ObjCoords {
    lat: number;
    lng: number;
    address: string;
}

export interface TripsForDashboard {
    trip_id: string;
    passenger_name: string;
    origin: ObjCoords;
    destination: ObjCoords;
    distance_km: number;
    fare: number;
    status: string;
    requested_at: string;
    started_at: string;
    completed_at: string;
    duration_minutes: string;
    passenger_rating: string;
    passenger_comment: string;
    driver_rating: string;
    driver_comment: string;
    driver_name: string;
}


export interface ITripRepository {
    createTrip(data: CreateTripDto): Promise<Trip | null>;
    findTripById(id: string): Promise<Trip | null>;
    listTripsByPassenger(passengerId: string): Promise<Trip[]>;
    listTripHistoryByPassenger(passengerId: string): Promise<TripRow[]>;
    rateTrip(data: { tripId: string; rating: 1 | 2 | 3; comment: string }): Promise<Trip | null>;
    listAllTrips(): Promise<TripsForDashboard[] | []>;

    //OPERATOR
    listTripsByOperator(operatorId: number): Promise<OperatorTripHistoryRow[]>;
}
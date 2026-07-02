import type { Pool } from "pg";
import { generateUUID } from "../../utils/uuid.js";
import type {
    CreateTripDto,
    ITripRepository,
    Trip,
    TripPoint,
    TripsForDashboard,
} from "./trip.types.js";
import type { OperatorTripHistoryRow } from "./tripHistoryOperator.mapper.js";

export interface TripRow {
    id: string;
    passenger_id: string;
    idoperador: number | null;
    origin: TripPoint;
    destination: TripPoint;
    destination_address: string;
    distance_km: string;
    fare: string;
    trip_status_id: number;
    service_type_id: number;
    requested_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_minutes: number;
    pricing_config_id: string | null;
    passenger_rating: number | null;
    driver_rating: number | null;
    passenger_comment: string | null;
    driver_comment: string | null;
    accepted_at: string | null;
    pickup_code: string | null;
}

const mapTrip = (row: TripRow): Trip => ({
    id: row.id,
    passengerId: row.passenger_id,
    idOperador: row.idoperador,
    origin: row.origin,
    destination: row.destination,
    destinationAddress: row.destination_address,
    distanceKm: row.distance_km,
    fare: row.fare,
    tripStatusId: row.trip_status_id,
    serviceTypeId: row.service_type_id,
    requestedAt: row.requested_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMinutes: row.duration_minutes,
    pricingConfigId: row.pricing_config_id,
    passengerRating: row.passenger_rating,
    driverRating: row.driver_rating,
    passengerComment: row.passenger_comment,
    driverComment: row.driver_comment,
    acceptedAt: row.accepted_at,
    pickupCode: row.pickup_code,
});

export class TripRepository implements ITripRepository {
    constructor(private readonly db: Pool) { }

    async createTrip(data: CreateTripDto): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
      INSERT INTO public.trips
        (
          id,
          passenger_id,
          origin,
          destination,
          destination_address,
          distance_km,
          fare,
          service_type_id,
          pricing_config_id
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
      `,
            [
                generateUUID(),
                data.passengerId,
                JSON.stringify(data.origin),
                JSON.stringify(data.destination),
                data.destinationAddress,
                data.distanceKm,
                data.fare,
                data.serviceTypeId,
                data.pricingConfigId ?? null,
            ]
        );

        const row = result.rows[0];

        return row ? mapTrip(row) : null;
    }

    async findTripById(id: string): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
      SELECT *
      FROM public.trips
      WHERE id = $1
      LIMIT 1;
      `,
            [id]
        );

        const row = result.rows[0];

        return row ? mapTrip(row) : null;
    }

    async listTripsByPassenger(passengerId: string): Promise<Trip[]> {
        const result = await this.db.query<TripRow>(
            `
      SELECT *
      FROM public.trips
      WHERE passenger_id = $1
      ORDER BY requested_at DESC;
      `,
            [passengerId]
        );

        return result.rows.map(mapTrip);
    }

    async listTripHistoryByPassenger(passengerId: string): Promise<TripRow[]> {
        const result = await this.db.query<TripRow>(
            `SELECT * FROM public.trips WHERE passenger_id = $1 AND trip_status_id IN (3,4) ORDER BY completed_at DESC NULLS LAST, requested_at DESC`,
            [passengerId]
        );

        // NO mapeas a Trip todavía
        return result.rows;
    }

    async listRequestedTripsForDriver(): Promise<Trip[]> {
        const result = await this.db.query<TripRow>(
            `
    SELECT *
    FROM public.trips
    WHERE trip_status_id = 1
      AND idoperador IS NULL
    ORDER BY requested_at ASC;
    `
        );

        return result.rows.map(mapTrip);
    }

    async acceptTrip(data: {
        tripId: string;
        idoperador: number;
        pickupCode: string;
    }): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
    UPDATE public.trips
    SET 
      trip_status_id = 2,
      idoperador = $2,
      pickup_code = $3,
      accepted_at = now()
    WHERE id = $1
      AND trip_status_id = 1
      AND idoperador IS NULL
    RETURNING *;
    `,
            [data.tripId, data.idoperador, data.pickupCode]
        );

        const row = result.rows[0];
        return row ? mapTrip(row) : null;
    }

    async startTrip(data: {
        tripId: string;
        idoperador: number;
        pickupCode: string;
    }): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
    UPDATE public.trips
    SET 
      trip_status_id = 3,
      started_at = now()
    WHERE id = $1
      AND idoperador = $2
      AND pickup_code = $3
      AND trip_status_id = 2
    RETURNING *;
    `,
            [data.tripId, data.idoperador, data.pickupCode]
        );

        const row = result.rows[0];
        return row ? mapTrip(row) : null;
    }

    async completeTrip(data: {
        tripId: string;
        idoperador: number;
    }): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
    UPDATE public.trips
    SET 
      trip_status_id = 4,
      completed_at = now(),
      duration_minutes = GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (now() - started_at)) / 60)::int
      )
    WHERE id = $1
      AND idoperador = $2
      AND trip_status_id = 3
    RETURNING *;
    `,
            [data.tripId, data.idoperador]
        );

        const row = result.rows[0];
        return row ? mapTrip(row) : null;
    }

    async rateTrip(data: { tripId: string; rating: 1 | 2 | 3; comment: string }): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
    UPDATE public.trips
    SET passenger_rating = $2,
        passenger_comment = $3
    WHERE id = $1
    RETURNING *;
    `,
            [data.tripId, data.rating, data.comment]
        );

        const row = result.rows[0];
        return row ? mapTrip(row) : null;
    }

    async rateTripOperator(data: { tripId: string; rating: 1 | 2 | 3; comment: string }): Promise<Trip | null> {
        const result = await this.db.query<TripRow>(
            `
    UPDATE public.trips
    SET driver_rating = $2,
        driver_comment = $3
    WHERE id = $1
    RETURNING *;
    `,
            [data.tripId, data.rating, data.comment]
        );

        const row = result.rows[0];
        return row ? mapTrip(row) : null;
    }

    async listAllTrips(): Promise<TripsForDashboard[] | []> {
        const result = await this.db.query(
            `
            select
                t.id as "trip_id",
                concat(p."name", ' ', p.paternal_surname, ' ', p.maternal_surname) as "passenger_name",
                t.origin,
                t.destination,
                t.distance_km,
                t.fare,
                ts.status,
                to_char(t.requested_at, 'DD/MM/YYYY HH12:MI:SS AM') as "requested_at",
                to_char(t.started_at, 'DD/MM/YYYY HH12:MI:SS AM') as "started_at",
                to_char(t.completed_at, 'DD/MM/YYYY HH12:MI:SS AM') as "completed_at",
                t.duration_minutes,
                t.passenger_rating,
                t.passenger_comment,
                t.driver_rating as "driver_rating",
            	t.driver_comment as "driver_comment",
            	concat(d.nombre, ' ', d.apellido_paterno , ' ', d.apellido_materno ) as "driver_name"
            from public.trips t
                join public.passenger p on p.id = t.passenger_id
                join public.trip_status ts on ts.id = t.trip_status_id
				join public.drivers d on d.id_operador = t.idoperador;
            `,
            []
        );

        if (result.rows.length === 0) {
            return [];
        }

        return result.rows.map((r) => (r));
    }

    async listTripsByOperator(
        operatorId: number
    ): Promise<OperatorTripHistoryRow[]> {
        const result = await this.db.query<OperatorTripHistoryRow>(
            `
        select
            t.id as "trip_id",
            concat_ws(' ', p."name", p.paternal_surname, p.maternal_surname) as "passenger_name",
            t.origin,
            t.destination,
            t.distance_km,
            t.fare,
            ts.status,
            to_char(t.requested_at, 'DD/MM/YYYY HH12:MI:SS AM') as "requested_at",
            to_char(t.started_at, 'DD/MM/YYYY HH12:MI:SS AM') as "started_at",
            to_char(t.completed_at, 'DD/MM/YYYY HH12:MI:SS AM') as "completed_at",
            t.duration_minutes,
            t.driver_rating as "driver_rating",
            t.driver_comment as "driver_comment"
        from public.trips t
            join public.passenger p on p.id = t.passenger_id
            join public.trip_status ts on ts.id = t.trip_status_id
        where t.idoperador = $1
        order by t.requested_at desc
        `,
            [operatorId]
        );

        return result.rows;
    }
}

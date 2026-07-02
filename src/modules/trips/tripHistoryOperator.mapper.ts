import { config } from "../../config/config.js";
import type { TripPoint } from "./trip.types.js";

const GOOGLE_API_KEY = config.API_KEY_GOOGLE;

export type OperatorTripHistoryRow = {
    trip_id: string | number;
    passenger_name: string | null;
    origin: TripPoint | null;
    destination: TripPoint | null;
    distance_km: string | number | null;
    fare: string | number | null;
    status: string;
    requested_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_minutes: string | number | null;
    driver_rating: string | number | null;
    driver_comment: string | null;
};

export type OperatorTripHistoryForApp = Omit<
    OperatorTripHistoryRow,
    "origin" | "destination"
> & {
    origin: TripPoint;
    destination: TripPoint;
};

const addressCache = new Map<string, string>();

const GENERIC_ADDRESSES = [
    "ubicacion actual",
    "ubicacion desconocida",
    "sin ubicacion",
    "ubicacion no disponible",
];

const normalizeText = (value?: string | null) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const isGenericAddress = (address?: string | null) => {
    const normalized = normalizeText(address);

    if (!normalized) return true;

    return GENERIC_ADDRESSES.includes(normalized);
};

const hasValidCoordinates = (point: TripPoint | null): point is TripPoint => {
    return (
        point !== null &&
        Number.isFinite(Number(point.lat)) &&
        Number.isFinite(Number(point.lng))
    );
};

const getCoordsKey = (point: TripPoint) => {
    const lat = Number(point.lat).toFixed(6);
    const lng = Number(point.lng).toFixed(6);

    return `${lat},${lng}`;
};

export async function getAddressFromCoordinates(
    point: TripPoint | null
): Promise<string> {
    if (!hasValidCoordinates(point)) {
        return "Ubicación desconocida";
    }

    const currentAddress = point.address ?? null;
    const hasRealAddress = currentAddress && !isGenericAddress(currentAddress);

    if (hasRealAddress) {
        return currentAddress;
    }

    if (!GOOGLE_API_KEY) {
        console.error("No existe API key de Google Maps");
        return "Ubicación desconocida";
    }

    const cacheKey = getCoordsKey(point);

    if (addressCache.has(cacheKey)) {
        return addressCache.get(cacheKey)!;
    }

    const params = new URLSearchParams({
        latlng: `${point.lat},${point.lng}`,
        key: GOOGLE_API_KEY,
        language: "es",
        region: "mx",
    });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.results?.length > 0) {
            const address =
                data.results[0]?.formatted_address ??
                "Ubicación desconocida";

            addressCache.set(cacheKey, address);

            return address;
        }

        console.error(
            "Error de geocoding:",
            data.status,
            data.error_message
        );
    } catch (error) {
        console.error("Error en geocoding:", error);
    }

    return "Ubicación desconocida";
}

export async function mapOperatorTripHistoryForApp(
    row: OperatorTripHistoryRow
): Promise<OperatorTripHistoryForApp> {
    const originAddress = await getAddressFromCoordinates(row.origin);
    const destinationAddress = await getAddressFromCoordinates(row.destination);

    return {
        ...row,
        origin: {
            lat: row.origin?.lat ?? 0,
            lng: row.origin?.lng ?? 0,
            address: originAddress,
        },
        destination: {
            lat: row.destination?.lat ?? 0,
            lng: row.destination?.lng ?? 0,
            address: destinationAddress,
        },
    };
}
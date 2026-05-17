import axios from "axios";
import validator from "validator";
import type { GeoRepository } from "./geo.repo.js";
import type {
    FindLocationOptions,
    LocationResult,
    MunicipalityFilters,
    RouteInfo,
} from "./geo.types.js";
import { config } from "../../config/config.js";
import { decodePolyline } from "../../utils/decodePolyline.js";

export class GeoService {
    constructor(private readonly geoRepository: GeoRepository) { }

    async listZones(active?: boolean) {
        return this.geoRepository.listZones(active);
    }

    async listMunicipalities(filters: MunicipalityFilters) {
        if (filters.zoneId && !validator.isUUID(filters.zoneId)) {
            throw new Error("El zoneId no es válido");
        }

        return this.geoRepository.listMunicipalities(filters);
    }

    async findLocation(
        q: unknown,
        options: FindLocationOptions = {}
    ): Promise<LocationResult[]> {
        if (!q || typeof q !== "string" || validator.isEmpty(q.trim())) {
            throw new Error("El parámetro q es requerido");
        }

        if (!config.API_KEY_GOOGLE) {
            throw new Error("Falta configurar API_KEY_GOOGLE");
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: q.trim(),
                    region: options.region ?? "mx",
                    language: options.language ?? "es",
                    components: options.components,
                    key: config.API_KEY_GOOGLE,
                },
                timeout: 10000,
            }
        );

        const { status, results, error_message } = response.data || {};

        if (status === "ZERO_RESULTS") {
            return [];
        }

        if (status !== "OK") {
            throw new Error(error_message || `Geocoding API error: ${status}`);
        }

        const limit = options.limit ?? 5;

        return results.slice(0, limit).map((item: any) => ({
            address: item.formatted_address,
            placeId: item.place_id,
            lat: item.geometry.location.lat,
            lng: item.geometry.location.lng,
        }));
    }

    async getRouteInfo(params: {
        originLat: number;
        originLng: number;
        destLat: number;
        destLng: number;
    }): Promise<RouteInfo> {
        const { originLat, originLng, destLat, destLng } = params;

        if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
            throw new Error("Coordenadas inválidas");
        }

        if (!config.API_KEY_GOOGLE) {
            throw new Error("Falta configurar API_KEY_GOOGLE");
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            {
                params: {
                    origin: `${originLat},${originLng}`,
                    destination: `${destLat},${destLng}`,
                    mode: "driving",
                    language: "es",
                    region: "mx",
                    key: config.API_KEY_GOOGLE,
                },
                timeout: 10000,
            }
        );

        const { status, routes, error_message } = response.data || {};

        if (status === "ZERO_RESULTS") {
            throw new Error("Sin ruta");
        }

        if (status !== "OK") {
            throw new Error(error_message || `Directions API error: ${status}`);
        }

        const route = routes?.[0];
        const leg = route?.legs?.[0];

        if (!route || !leg) {
            throw new Error("Sin ruta");
        }

        const legs = route.legs || [];

        const distanceMeters = legs.reduce(
            (acc: number, l: any) => acc + Number(l?.distance?.value || 0),
            0
        );

        const durationSec = legs.reduce(
            (acc: number, l: any) => acc + Number(l?.duration?.value || 0),
            0
        );

        const encoded = route?.overview_polyline?.points as string | undefined;
        const path = encoded ? decodePolyline(encoded) : [];

        return {
            distanceMeters,
            distanceKm: distanceMeters / 1000,
            durationSec,
            durationMin: durationSec / 60,
            path,
            distanceText: leg?.distance?.text ?? null,
            durationText: leg?.duration?.text ?? null,
        };
    }
}
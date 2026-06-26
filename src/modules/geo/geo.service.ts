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

    async getMunicipalityByCoordinates(lat: number, lng: number) {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new Error("Coordenadas inválidas");
        }

        if (!config.API_KEY_GOOGLE) {
            throw new Error("Falta configurar API_KEY_GOOGLE");
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    latlng: `${lat},${lng}`,
                    language: "es",
                    region: "mx",
                    key: config.API_KEY_GOOGLE,
                },
                timeout: 10000,
            }
        );

        const { status, results, error_message } = response.data || {};

        if (status !== "OK") {
            throw new Error(error_message || `Geocoding API error: ${status}`);
        }

        const components =
            results?.flatMap((r: any) => r.address_components ?? []) ?? [];

        const municipalityComponent =
            components.find((c: any) =>
                c.types?.includes("administrative_area_level_2")
            ) ??
            components.find((c: any) =>
                c.types?.includes("locality")
            ) ??
            components.find((c: any) =>
                c.types?.includes("administrative_area_level_3")
            ) ??
            components.find((c: any) =>
                c.types?.includes("sublocality")
            );

        if (!municipalityComponent) {
            console.log(
                "[GEO COMPONENTS]",
                components.map((c: any) => ({
                    long_name: c.long_name,
                    short_name: c.short_name,
                    types: c.types,
                }))
            );

            throw new Error("No se pudo obtener el municipio con las coordenadas");
        }

        const possibleNames = [
            municipalityComponent.long_name,
            municipalityComponent.short_name,
        ].filter(Boolean);

        let municipality = null;

        for (const name of possibleNames) {
            municipality = await this.geoRepository.findMunicipalityByName(name);

            if (municipality) break;
        }

        if (!municipality) {
            console.log("[MUNICIPALITY NOT FOUND]", {
                possibleNames,
                component: municipalityComponent,
            });

            throw new Error(`Municipio no registrado: ${possibleNames.join(" / ")}`);
        }

        return {
            municipalityId: municipality.id,
            name: municipality.name,
            zoneId: municipality.zone_id,
        };
    }

    private addressCache = new Map<string, string | null>();

    async getAddressByCoords(lat: number, lng: number): Promise<string | null> {
        try {
            if (!lat || !lng) {
                return null;
            }

            const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

            if (this.addressCache.has(cacheKey)) {
                return this.addressCache.get(cacheKey) || null;
            }

            const API_KEY = config.API_KEY_GOOGLE;

            const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");

            url.searchParams.set("latlng", `${lat},${lng}`);
            url.searchParams.set("key", API_KEY);
            url.searchParams.set("language", "es");

            const response = await fetch(url.toString());

            if (!response.ok) {
                console.error("Error HTTP en geocoding:", response.status);
                return null;
            }

            const data = await response.json();

            if (data.status !== "OK") {
                console.error("Error de geocoding:", data.status, data.error_message);
                return null;
            }

            const address = data.results[0]?.formatted_address || null;

            this.addressCache.set(cacheKey, address);

            return address;
        } catch (error) {
            console.error("Error obteniendo dirección por coordenadas:", error);
            return null;
        }
    }
}
export type FindLocationOptions = {
    region?: string;
    language?: string;
    components?: string;
    limit?: number;
};

export interface Zone {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

export interface ZoneRow {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

export interface Municipality {
    id: string;
    name: string;
    number: number | null;
    zoneId: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface MunicipalityRow {
    id: string;
    name: string;
    number: number | null;
    zone_id: string | null;
    is_active: boolean;
    created_at: string;
}

export interface MunicipalityFilters {
    zoneId?: string;
    active?: boolean;
}

export interface LocationResult {
    address: string;
    placeId: string;
    lat: number;
    lng: number;
}

export interface RouteInfo {
    distanceMeters: number;
    distanceKm: number;
    durationSec: number;
    durationMin: number;
    path: Array<{
        latitude: number;
        longitude: number;
    }>;
    distanceText: string | null;
    durationText: string | null;
}

export interface IGeoRepository {
    listZones(active?: boolean): Promise<Zone[]>;
    listMunicipalities(filters: MunicipalityFilters): Promise<Municipality[]>;
    findMunicipalityByName(name: string): Promise<any | null>;
}
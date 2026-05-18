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

export interface ZoneDto {
    name: string;
    isActive?: boolean;
}

export interface ZoneUpdateDto {
    name?: string;
    isActive?: boolean;
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

export interface IZoneRepository {
    listZones(params: { active?: boolean }): Promise<Zone[]>;
    findById(id: string): Promise<Zone | null>;
    findByName(name: string): Promise<Zone | null>;
    createZone(data: { id: string; name: string; isActive: boolean }): Promise<Zone | null>;
    updateZone(id: string, patch: ZoneUpdateDto): Promise<Zone | null>;
    listMunicipalities(params: MunicipalityFilters): Promise<Municipality[]>;
    setMunicipalityZone(municipalityId: string, zoneId: string | null): Promise<{ id: string; zoneId: string | null } | null>;
    bulkSetMunicipalitiesZone(zoneId: string, municipalityIds: string[]): Promise<Array<{ id: string; zoneId: string | null }>>;
    bulkSyncZoneMunicipalities(zoneId: string, keepIds: string[]): Promise<Array<{ id: string; zoneId: string | null }>>;
}
export type PricingScope = "GLOBAL" | "ZONE" | "MUNICIPALITY";

export interface PricingConfig {
    id: string;
    scope: PricingScope;
    zoneId: string | null;
    municipalityId: string | null;
    baseFare: string;
    perMinute: string;
    perKm: string;
    isActive: boolean;
    createdAt: string;
}

export interface PricingConfigDto {
    scope: PricingScope;
    zoneId?: string | null;
    municipalityId?: string | null;
    baseFare: number;
    perMinute: number;
    perKm: number;
    isActive?: boolean;
}

export interface PricingConfigUpdateDto {
    baseFare?: number;
    perMinute?: number;
    perKm?: number;
    isActive?: boolean;
}

export interface PricingConfigFilters {
    scope?: PricingScope;
    zoneId?: string;
    municipalityId?: string;
    active?: boolean;
}

export interface IPricingRepository {
    listPricingConfigs(filters: PricingConfigFilters): Promise<PricingConfig[]>;
    findById(id: string): Promise<PricingConfig | null>;
    deactivateSameScope(data: {
        scope: PricingScope;
        zoneId?: string | null;
        municipalityId?: string | null;
    }): Promise<void>;
    createPricingConfig(data: PricingConfigDto): Promise<PricingConfig | null>;
    updatePricingConfig(
        id: string,
        patch: PricingConfigUpdateDto
    ): Promise<PricingConfig | null>;
    resolvePricingForMunicipality(
        municipalityId: string
    ): Promise<PricingConfig | null>;
    getActiveGlobalPricing(): Promise<PricingConfig | null>;
}
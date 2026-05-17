import type { Pool } from "pg";
import { generateUUID } from "../../utils/uuid.js";
import type {
    IPricingRepository,
    PricingConfig,
    PricingConfigDto,
    PricingConfigFilters,
    PricingConfigUpdateDto,
    PricingScope,
} from "./pricing.types.js";

interface PricingConfigRow {
    id: string;
    scope: PricingScope;
    zone_id: string | null;
    municipality_id: string | null;
    base_fare: string;
    per_minute: string;
    per_km: string;
    is_active: boolean;
    created_at: string;
}

const mapPricingConfig = (row: PricingConfigRow): PricingConfig => ({
    id: row.id,
    scope: row.scope,
    zoneId: row.zone_id,
    municipalityId: row.municipality_id,
    baseFare: row.base_fare,
    perMinute: row.per_minute,
    perKm: row.per_km,
    isActive: row.is_active,
    createdAt: row.created_at,
});

export class PricingRepository implements IPricingRepository {
    constructor(private readonly db: Pool) { }

    async listPricingConfigs(filters: PricingConfigFilters): Promise<PricingConfig[]> {
        const where: string[] = ["1=1"];
        const params: any[] = [];

        if (filters.scope) {
            params.push(filters.scope);
            where.push(`pc.scope = $${params.length}`);
        }

        if (filters.zoneId) {
            params.push(filters.zoneId);
            where.push(`pc.zone_id = $${params.length}`);
        }

        if (filters.municipalityId) {
            params.push(filters.municipalityId);
            where.push(`pc.municipality_id = $${params.length}`);
        }

        if (typeof filters.active === "boolean") {
            params.push(filters.active);
            where.push(`pc.is_active = $${params.length}`);
        }

        const result = await this.db.query<PricingConfigRow>(
            `
      SELECT *
      FROM public.pricing_config pc
      WHERE ${where.join(" AND ")}
      ORDER BY pc.created_at DESC;
      `,
            params
        );

        return result.rows.map(mapPricingConfig);
    }

    async findById(id: string): Promise<PricingConfig | null> {
        const result = await this.db.query<PricingConfigRow>(
            `
      SELECT *
      FROM public.pricing_config
      WHERE id = $1
      LIMIT 1;
      `,
            [id]
        );

        const row = result.rows[0];

        return row ? mapPricingConfig(row) : null;
    }

    async deactivateSameScope(params: {
        scope: PricingScope;
        zoneId?: string | null;
        municipalityId?: string | null;
    }): Promise<void> {
        if (params.scope === "GLOBAL") {
            await this.db.query(
                `
        UPDATE public.pricing_config
        SET is_active = false
        WHERE scope = 'GLOBAL'
          AND is_active = true;
        `
            );
            return;
        }

        if (params.scope === "ZONE") {
            await this.db.query(
                `
        UPDATE public.pricing_config
        SET is_active = false
        WHERE scope = 'ZONE'
          AND zone_id = $1
          AND is_active = true;
        `,
                [params.zoneId]
            );
            return;
        }

        await this.db.query(
            `
      UPDATE public.pricing_config
      SET is_active = false
      WHERE scope = 'MUNICIPALITY'
        AND municipality_id = $1
        AND is_active = true;
      `,
            [params.municipalityId]
        );
    }

    async createPricingConfig(data: PricingConfigDto): Promise<PricingConfig | null> {
        const result = await this.db.query<PricingConfigRow>(
            `
      INSERT INTO public.pricing_config
        (id, scope, zone_id, municipality_id, base_fare, per_minute, per_km, is_active)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
            [
                generateUUID(),
                data.scope,
                data.zoneId ?? null,
                data.municipalityId ?? null,
                data.baseFare,
                data.perMinute,
                data.perKm,
                data.isActive ?? true,
            ]
        );

        const row = result.rows[0];

        return row ? mapPricingConfig(row) : null;
    }

    async updatePricingConfig(
        id: string,
        patch: PricingConfigUpdateDto
    ): Promise<PricingConfig | null> {
        const sets: string[] = [];
        const params: any[] = [];

        if (patch.baseFare !== undefined) {
            params.push(patch.baseFare);
            sets.push(`base_fare = $${params.length}`);
        }

        if (patch.perMinute !== undefined) {
            params.push(patch.perMinute);
            sets.push(`per_minute = $${params.length}`);
        }

        if (patch.perKm !== undefined) {
            params.push(patch.perKm);
            sets.push(`per_km = $${params.length}`);
        }

        if (patch.isActive !== undefined) {
            params.push(patch.isActive);
            sets.push(`is_active = $${params.length}`);
        }

        if (sets.length === 0) {
            return this.findById(id);
        }

        params.push(id);

        const result = await this.db.query<PricingConfigRow>(
            `
      UPDATE public.pricing_config
      SET ${sets.join(", ")}
      WHERE id = $${params.length}
      RETURNING *;
      `,
            params
        );

        const row = result.rows[0];

        return row ? mapPricingConfig(row) : null;
    }

    async resolvePricingForMunicipality(
        municipalityId: string
    ): Promise<PricingConfig | null> {
        const result = await this.db.query<PricingConfigRow>(
            `
      SELECT pc.*
      FROM public.pricing_config pc
      LEFT JOIN public.municipality m ON m.id = $1
      WHERE pc.is_active = true
        AND (
          (pc.scope = 'MUNICIPALITY' AND pc.municipality_id = m.id)
          OR (pc.scope = 'ZONE' AND pc.zone_id = m.zone_id)
          OR (pc.scope = 'GLOBAL')
        )
      ORDER BY
        CASE
          WHEN pc.scope = 'MUNICIPALITY' THEN 1
          WHEN pc.scope = 'ZONE' THEN 2
          ELSE 3
        END
      LIMIT 1;
      `,
            [municipalityId]
        );

        const row = result.rows[0];

        return row ? mapPricingConfig(row) : null;
    }

    async getActiveGlobalPricing(): Promise<PricingConfig | null> {
        const result = await this.db.query<PricingConfigRow>(
            `
      SELECT *
      FROM public.pricing_config
      WHERE scope = 'GLOBAL'
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1;
      `
        );

        const row = result.rows[0];

        return row ? mapPricingConfig(row) : null;
    }
}
import type { Pool } from "pg";
import type {
    IZoneRepository,
    Municipality,
    MunicipalityFilters,
    MunicipalityRow,
    Zone,
    ZoneRow,
    ZoneUpdateDto,
} from "./zone.types.js";

const mapZone = (row: ZoneRow): Zone => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
});

const mapMunicipality = (row: MunicipalityRow): Municipality => ({
    id: row.id,
    name: row.name,
    number: row.number,
    zoneId: row.zone_id,
    isActive: row.is_active,
    createdAt: row.created_at,
});

export class ZoneRepository implements IZoneRepository {
    constructor(private readonly db: Pool) { }

    async listZones(params: { active?: boolean }): Promise<Zone[]> {
        const active = params.active ?? null;

        const result = await this.db.query<ZoneRow>(
            `
      SELECT id, name, is_active, created_at
      FROM public.zones
      WHERE ($1::boolean IS NULL OR is_active = $1)
      ORDER BY created_at DESC;
      `,
            [active]
        );

        return result.rows.map(mapZone);
    }

    async findById(id: string): Promise<Zone | null> {
        const result = await this.db.query<ZoneRow>(
            `
      SELECT id, name, is_active, created_at
      FROM public.zones
      WHERE id = $1
      LIMIT 1;
      `,
            [id]
        );

        return result.rows[0] ? mapZone(result.rows[0]) : null;
    }

    async findByName(name: string): Promise<Zone | null> {
        const result = await this.db.query<ZoneRow>(
            `
      SELECT id, name, is_active, created_at
      FROM public.zones
      WHERE lower(name) = lower($1)
      LIMIT 1;
      `,
            [name]
        );

        return result.rows[0] ? mapZone(result.rows[0]) : null;
    }

    async createZone(data: {
        id: string;
        name: string;
        isActive: boolean;
    }): Promise<Zone | null> {
        const result = await this.db.query<ZoneRow>(
            `
      INSERT INTO public.zones (id, name, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, name, is_active, created_at;
      `,
            [data.id, data.name, data.isActive]
        );

        return result.rows[0] ? mapZone(result.rows[0]) : null;
    }

    async updateZone(id: string, patch: ZoneUpdateDto): Promise<Zone | null> {
        const setName = patch.name ?? null;
        const setActive = patch.isActive ?? null;

        const result = await this.db.query<ZoneRow>(
            `
      UPDATE public.zones
      SET
        name = COALESCE($2, name),
        is_active = COALESCE($3::boolean, is_active)
      WHERE id = $1
      RETURNING id, name, is_active, created_at;
      `,
            [id, setName, setActive]
        );

        return result.rows[0] ? mapZone(result.rows[0]) : null;
    }

    async listMunicipalities(params: MunicipalityFilters): Promise<Municipality[]> {
        const zoneId = params.zoneId ?? null;
        const active = params.active ?? null;

        const result = await this.db.query<MunicipalityRow>(
            `
      SELECT id, name, number, zone_id, is_active, created_at
      FROM public.municipality
      WHERE ($1::uuid IS NULL OR zone_id = $1)
        AND ($2::boolean IS NULL OR is_active = $2)
      ORDER BY name ASC;
      `,
            [zoneId, active]
        );

        return result.rows.map(mapMunicipality);
    }

    async setMunicipalityZone(
        municipalityId: string,
        zoneId: string | null
    ): Promise<{ id: string; zoneId: string | null } | null> {
        const result = await this.db.query<{ id: string; zone_id: string | null }>(
            `
      UPDATE public.municipality
      SET zone_id = $2
      WHERE id = $1
      RETURNING id, zone_id;
      `,
            [municipalityId, zoneId]
        );

        const row = result.rows[0];

        return row ? { id: row.id, zoneId: row.zone_id } : null;
    }

    async bulkSetMunicipalitiesZone(
        zoneId: string,
        municipalityIds: string[]
    ): Promise<Array<{ id: string; zoneId: string | null }>> {
        const result = await this.db.query<{ id: string; zone_id: string | null }>(
            `
      UPDATE public.municipality
      SET zone_id = $1
      WHERE id = ANY($2::uuid[])
      RETURNING id, zone_id;
      `,
            [zoneId, municipalityIds]
        );

        return result.rows.map((row) => ({
            id: row.id,
            zoneId: row.zone_id,
        }));
    }

    async bulkSyncZoneMunicipalities(
        zoneId: string,
        keepIds: string[]
    ): Promise<Array<{ id: string; zoneId: string | null }>> {
        const result = await this.db.query<{ id: string; zone_id: string | null }>(
            `
      UPDATE public.municipality
      SET zone_id = null
      WHERE zone_id = $1
        AND NOT (id = ANY($2::uuid[]))
      RETURNING id, zone_id;
      `,
            [zoneId, keepIds]
        );

        return result.rows.map((row) => ({
            id: row.id,
            zoneId: row.zone_id,
        }));
    }
}
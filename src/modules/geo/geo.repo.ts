import type { Pool } from "pg";
import type {
    IGeoRepository,
    Municipality,
    MunicipalityFilters,
    MunicipalityRow,
    Zone,
    ZoneRow,
} from "./geo.types.js";

const mapZoneRow = (row: ZoneRow): Zone => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
});

const mapMunicipalityRow = (row: MunicipalityRow): Municipality => ({
    id: row.id,
    name: row.name,
    number: row.number,
    zoneId: row.zone_id,
    isActive: row.is_active,
    createdAt: row.created_at,
});

export class GeoRepository implements IGeoRepository {
    constructor(private readonly db: Pool) { }

    async listZones(active?: boolean): Promise<Zone[]> {
        const params: any[] = [];
        const where: string[] = ["1=1"];

        // Si active viene true/false, filtramos zonas activas o inactivas
        if (typeof active === "boolean") {
            params.push(active);
            where.push(`z.is_active = $${params.length}`);
        }

        const result = await this.db.query<ZoneRow>(
            `
      SELECT 
        z.id,
        z.name,
        z.is_active,
        z.created_at
      FROM public.zones z
      WHERE ${where.join(" AND ")}
      ORDER BY z.name ASC;
      `,
            params
        );

        return result.rows.map(mapZoneRow);
    }

    async listMunicipalities(filters: MunicipalityFilters): Promise<Municipality[]> {
        const params: any[] = [];
        const where: string[] = ["1=1"];

        // Filtrar por zona
        if (filters.zoneId) {
            params.push(filters.zoneId);
            where.push(`m.zone_id = $${params.length}`);
        }

        // Filtrar por activo/inactivo
        if (typeof filters.active === "boolean") {
            params.push(filters.active);
            where.push(`m.is_active = $${params.length}`);
        }

        const result = await this.db.query<MunicipalityRow>(
            `
      SELECT
        m.id,
        m.name,
        m.number,
        m.zone_id,
        m.is_active,
        m.created_at
      FROM public.municipality m
      WHERE ${where.join(" AND ")}
      ORDER BY m.name ASC;
      `,
            params
        );

        return result.rows.map(mapMunicipalityRow);
    }

    async findMunicipalityByName(name: string) {
        const result = await this.db.query(
            `
    SELECT id, name, number, zone_id, is_active, created_at
    FROM public.municipality
    WHERE lower(name) ILIKE lower($1)
    LIMIT 1;
    `,
            [`%${name}%`]
        );

        return result.rows[0] ?? null;
    }
}
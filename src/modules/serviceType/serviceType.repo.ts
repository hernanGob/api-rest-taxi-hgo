import type { Pool } from "pg";
import type {
    IServiceTypeRepository,
    ServiceType,
    ServiceTypeRow,
} from "./serviceType.types.js";

const mapServiceType = (row: ServiceTypeRow): ServiceType => ({
    id: row.id,
    name: row.name,
    increasePercentage: row.increase_percentage,
});

export class ServiceTypeRepository implements IServiceTypeRepository {
    constructor(private readonly db: Pool) { }

    async listServiceTypes(): Promise<ServiceType[]> {
        const result = await this.db.query<ServiceTypeRow>(
            `
      SELECT id, name, increase_percentage
      FROM public.service_type
      ORDER BY id ASC;
      `
        );

        return result.rows.map(mapServiceType);
    }
}
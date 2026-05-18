import type { Pool } from "pg";
import type {
    DriverAuth,
    DriverAuthRow,
    IDriverAuthRepository,
} from "./driverAuth.types.js";

const mapDriverAuth = (row: DriverAuthRow): DriverAuth => ({
    id: row.id,
    idoperador: row.id_operador,
    password: row.password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export class DriverAuthRepository implements IDriverAuthRepository {
    constructor(private readonly db: Pool) { }

    async findByIdOperador(idoperador: number): Promise<DriverAuth | null> {
        const result = await this.db.query<DriverAuthRow>(
            `
      SELECT id, id_operador, password, created_at, updated_at
      FROM public.drivers
      WHERE id_operador = $1
      LIMIT 1;
      `,
            [idoperador]
        );

        const row = result.rows[0];

        return row ? mapDriverAuth(row) : null;
    }

    async createDriverAuth(data: {
        id: string;
        idoperador: number;
        password: string | null;
    }): Promise<DriverAuth | null> {
        const result = await this.db.query<DriverAuthRow>(
            `
      INSERT INTO public.drivers
        (id, id_operador, password, created_at, updated_at)
      VALUES
        ($1, $2, $3, now(), now())
      RETURNING id, id_operador, password, created_at, updated_at;
      `,
            [data.id, data.idoperador, data.password]
        );

        const row = result.rows[0];

        return row ? mapDriverAuth(row) : null;
    }

    async updatePassword(
        idoperador: number,
        password: string
    ): Promise<DriverAuth | null> {
        const result = await this.db.query<DriverAuthRow>(
            `
      UPDATE public.drivers
      SET password = $2,
          updated_at = now()
      WHERE id_operador = $1
      RETURNING id, id_operador, password, created_at, updated_at;
      `,
            [idoperador, password]
        );

        const row = result.rows[0];

        return row ? mapDriverAuth(row) : null;
    }
}
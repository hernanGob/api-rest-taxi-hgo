import type { Pool } from "pg";
import type { IUserRepository, User } from "./admin.types.js";

interface UserRow {
    id: string;
    name: string;
    paternal_surname: string;
    maternal_surname: string;
    phone: string;
    email: string;
    password_hash: string | null;
    created_at: string;
    updated_at: string;
    user_role_id: string | null;
    user_role: string | null;
}

export class UserRepository implements IUserRepository {
    constructor(private readonly db: Pool) { }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.db.query<UserRow>(
            `
      SELECT
        u.id,
        u.name,
        u.paternal_surname,
        u.maternal_surname,
        u.phone,
        u.email,
        u.password_hash,
        u.created_at,
        u.updated_at,
        u.user_role_id,
        ur.code as "user_role"
      FROM public."user" u
      join public.user_role ur on ur.id = u.user_role_id
      WHERE u.email = trim(lower($1))
      LIMIT 1;
      `,
            [email]
        );

        const row = result.rows[0];

        if (!row) return null;

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternal_surname,
            maternalSurname: row.maternal_surname,
            phone: row.phone,
            email: row.email,
            passwordHash: row.password_hash,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userRoleId: row.user_role_id,
            userRole: row.user_role,
        };
    }
}
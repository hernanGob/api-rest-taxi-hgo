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
    user_role_id: string;
    user_role: string | null;

    two_factor_secret: string | null;
    two_factor_enabled: boolean;
    two_factor_enabled_at: string | null;
}

export class UserRepository implements IUserRepository {
    constructor(private readonly db: Pool) { }

    private mapUser(
        row: UserRow,
    ): User {
        return {
            id: row.id,
            name: row.name,
            paternalSurname:
                row.paternal_surname,
            maternalSurname:
                row.maternal_surname,
            phone: row.phone,
            email: row.email,
            passwordHash:
                row.password_hash,
            createdAt:
                row.created_at,
            updatedAt:
                row.updated_at,
            userRoleId:
                row.user_role_id,
            userRole:
                row.user_role,

            twoFactorSecret:
                row.two_factor_secret,

            twoFactorEnabled:
                row.two_factor_enabled,

            twoFactorEnabledAt:
                row.two_factor_enabled_at,
        };
    }

    private getUserSelect(): string {
        return `
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

                u.two_factor_secret,
                u.two_factor_enabled,
                u.two_factor_enabled_at,

                ur.code AS user_role

            FROM public."user" u

            INNER JOIN public.user_role ur
                ON ur.id = u.user_role_id
        `;
    }

    async findByEmail(
        email: string,
    ): Promise<User | null> {
        const result =
            await this.db.query<UserRow>(
                `
                    ${this.getUserSelect()}

                    WHERE lower(trim(u.email)) =
                        lower(trim($1))

                    LIMIT 1;
                `,
                [email],
            );

        const row = result.rows[0];

        return row
            ? this.mapUser(row)
            : null;
    }

    async findById(
        id: string,
    ): Promise<User | null> {
        const result =
            await this.db.query<UserRow>(
                `
                    ${this.getUserSelect()}

                    WHERE u.id = $1

                    LIMIT 1;
                `,
                [id],
            );

        const row = result.rows[0];

        return row
            ? this.mapUser(row)
            : null;
    }

    async saveTwoFactorSecret(
        id: string,
        secret: string,
    ): Promise<boolean> {
        const result =
            await this.db.query(
                `
                    UPDATE public."user"
                    SET
                        two_factor_secret = $1,
                        two_factor_enabled = FALSE,
                        two_factor_enabled_at = NULL,
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING id;
                `,
                [
                    secret,
                    id,
                ],
            );

        return result.rowCount === 1;
    }

    async enableTwoFactor(
        id: string,
    ): Promise<boolean> {
        const result =
            await this.db.query(
                `
                    UPDATE public."user"
                    SET
                        two_factor_enabled = TRUE,
                        two_factor_enabled_at = NOW(),
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING id;
                `,
                [id],
            );

        return result.rowCount === 1;
    }

    async clearTwoFactorConfiguration(
        id: string,
    ): Promise<boolean> {
        const result =
            await this.db.query(
                `
                    UPDATE public."user"
                    SET
                        two_factor_enabled = FALSE,
                        two_factor_secret = NULL,
                        two_factor_enabled_at = NULL,
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING id;
                `,
                [id],
            );

        return result.rowCount === 1;
    }
}
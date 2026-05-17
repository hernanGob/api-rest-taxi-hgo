import type { Pool } from "pg";
import type { EmergencyContact, EmergencyContactDto, IEmergencyContactRepository } from "./emergencyContact.types.js";
import { generateUUID } from "../../utils/uuid.js";

export interface EmergencyContactRow {
    id: string;
    name: string;
    paternalSurname: string;
    maternalSurname: string;
    phone: string;
    email: string;
}

export class EmergencyContactRepository implements IEmergencyContactRepository {
    constructor(
        private readonly db: Pool
    ) { }

    async createEmergencyContact(data: EmergencyContactDto): Promise<EmergencyContact | null> {
        const result = await this.db.query<EmergencyContactRow>(
            `INSERT INTO public.emergency_contact
            (id, "name", paternal_surname, maternal_surname, phone, email, created_at, updated_at)
            VALUES($1, $2, $3, $4, $5, $6, now(), now()) returning *;`,
            [generateUUID(), data.name, data.paternalSurname, data.maternalSurname, data.phone, data.email.trim().toLocaleLowerCase()]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternalSurname,
            maternalSurname: row.maternalSurname,
            email: row.email,
            phone: row.phone,
        }
    }

    async findById(id: string): Promise<EmergencyContact | null> {
        const result = await this.db.query<EmergencyContactRow>(
            `SELECT 
            id,
            "name",
            paternal_surname,
            maternal_surname,
            phone,
            email
            FROM public.emergency_contact
            WHERE id = $1;`,
            [id]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternalSurname,
            maternalSurname: row.maternalSurname,
            email: row.email,
            phone: row.phone,
        }
    }

    async findByEmail(email: string): Promise<EmergencyContact | null> {
        const result = await this.db.query<EmergencyContactRow>(
            `SELECT 
            id,
            "name",
            paternal_surname,
            maternal_surname,
            phone,
            email
            FROM public.emergency_contact
            WHERE email = lower(trim($1));`,
            [email]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternalSurname,
            maternalSurname: row.maternalSurname,
            email: row.email,
            phone: row.phone,
        }
    }

    async updateEmergencyContact(data: EmergencyContactDto): Promise<EmergencyContact | null> {
        const result = await this.db.query<EmergencyContactRow>(
            `UPDATE public.emergency_contact
            SET 
            "name"=$1, 
            paternal_surname=$2, 
            maternal_surname=$3, 
            phone=$4,
            email=trim(lower($5)),
            updated_at=now()
            WHERE id=$6
            returning *;`,
            [data.name, data.paternalSurname, data.maternalSurname, data.phone, data.email, data.id]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternalSurname,
            maternalSurname: row.maternalSurname,
            email: row.email,
            phone: row.phone,
        }
    }

    async deleteEmergencyContact(id: string): Promise<EmergencyContact | null> {
        const result = await this.db.query<EmergencyContactRow>(
            `DELETE FROM public.emergency_contact
            WHERE id=$1
            returning id;`,
            [id]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternalSurname,
            maternalSurname: row.maternalSurname,
            email: row.email,
            phone: row.phone,
        }
    }
}
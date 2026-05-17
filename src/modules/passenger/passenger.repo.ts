import type { Pool } from "pg";
import type { IPassengerRepository, Passenger, PassengerDto } from "./passenger.types.js";
import { generateUUID } from "../../utils/uuid.js";
import type { EmergencyContactDto } from "../emergencyContact/emergencyContact.types.js";
import type { EmergencyContactRow } from "../emergencyContact/emergencyContact.repo.js";

interface PassengerRow {
    id: string;
    name: string;
    paternal_surname: string;
    maternal_surname: string;
    phone: string;
    email: string;
    password: string | null;
    emergency_contact_id: string | null;
    date_of_birth: string;
}

export class PassengerRepository implements IPassengerRepository {
    constructor(
        private readonly db: Pool
    ) { }

    async createPassenger(data: PassengerDto, dataEmergencyContact: EmergencyContactDto | null, addEmergencyContact: Boolean): Promise<Passenger | null> {

        let idEmergencyContact;
        if (addEmergencyContact && dataEmergencyContact) {
            const resultEmergencyContact = await this.db.query<EmergencyContactRow>(
                `INSERT INTO public.emergency_contact
                (id, "name", paternal_surname, maternal_surname, phone, email, created_at, updated_at)
                VALUES($1, $2, $3, $4, $5, $6, now(), now()) returning *;`,
            [generateUUID(), dataEmergencyContact.name, dataEmergencyContact.paternalSurname, dataEmergencyContact.maternalSurname, dataEmergencyContact.phone, dataEmergencyContact.email.trim().toLocaleLowerCase()]
            );

            const rowEmergencyContact = resultEmergencyContact.rows[0];

            if(!rowEmergencyContact){
                throw new Error("Error al agregar el contacto de emergencia");
            }

            idEmergencyContact = rowEmergencyContact.id;
        }

        const result = await this.db.query<PassengerRow>(
            `INSERT INTO public.passenger
            (id, "name", paternal_surname, maternal_surname, phone, email, "password", emergency_contact_id, date_of_birth, created_at, updated_at)
            VALUES($1, $2, $3, $4, $5, trim(lower($6)), $7, $8, $9, now(), now())
            returning *;`,
            [generateUUID(), data.name, data.paternalSurname, data.maternalSurname, data.phone, data.email.trim().toLowerCase(), data.password, addEmergencyContact ? idEmergencyContact : null, data.dateOfBirth]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternal_surname,
            maternalSurname: row.maternal_surname,
            dateOfBirth: row.date_of_birth,
            email: row.email,
            phone: row.phone,
            emergencyContactId: row.emergency_contact_id
        }
    }

    async findPassengerByEmail(email: string): Promise<Passenger | null> {
        const result = await this.db.query<PassengerRow>(
            `SELECT * FROM passenger p where p.email = LOWER(TRIM($1));`,
            [email]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternal_surname,
            maternalSurname: row.maternal_surname,
            dateOfBirth: row.date_of_birth,
            email: row.email,
            phone: row.phone,
            password: row.password,
            emergencyContactId: row.emergency_contact_id
        }
    }

    async findPassengerById(id: string): Promise<Passenger | null> {
        const result = await this.db.query<PassengerRow>(
            `SELECT * FROM passenger p where p.id = $1;`,
            [id]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            name: row.name,
            paternalSurname: row.paternal_surname,
            maternalSurname: row.maternal_surname,
            dateOfBirth: row.date_of_birth,
            email: row.email,
            phone: row.phone,
            emergencyContactId: row.emergency_contact_id
        }
    }
}


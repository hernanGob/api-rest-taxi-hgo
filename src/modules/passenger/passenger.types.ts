import type { EmergencyContactDto } from "../emergencyContact/emergencyContact.types.js";

export interface Passenger {
    id: string;
    name: string;
    paternalSurname: string;
    maternalSurname: string;
    phone: string;
    email: string;
    password?: string | null;
    emergencyContactId: string | null;
    dateOfBirth: string;
}

export interface PassengerDto {
    id?: string;
    name: string;
    paternalSurname: string;
    maternalSurname: string;
    phone: string;
    email: string;
    password: string;
    emergencyContactId?: string | null;
    dateOfBirth: string;
}

export interface IPassengerRepository {
    createPassenger(data: PassengerDto, dataEmergencyContact: EmergencyContactDto, addEmergencyContact: Boolean): Promise<Passenger | null>;
    findPassengerByEmail(email: string): Promise<Passenger | null>;
    findPassengerById(id: string): Promise<Passenger | null>;
}
export interface EmergencyContact {
    id: string;
    name: string;
    paternalSurname: string;
    maternalSurname: string;
    phone: string;
    email: string;
}

export interface EmergencyContactDto {
    id?: string;
    name: string;
    paternalSurname: string;
    maternalSurname: string;
    phone: string;
    email: string;
}

export interface IEmergencyContactRepository {
    createEmergencyContact(data: EmergencyContactDto): Promise<EmergencyContact | null>;
    updateEmergencyContact(data: EmergencyContactDto): Promise<EmergencyContact | null>;
    deleteEmergencyContact(id: string): Promise<EmergencyContact | null>;
    findById(id: string): Promise<EmergencyContact | null>;
    findByEmail(email: string): Promise<EmergencyContact | null>;
}

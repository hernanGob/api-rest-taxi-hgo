import type { EmergencyContactRepository } from "./emergencyContact.repo.js";
import type { EmergencyContactDto } from "./emergencyContact.types.js";



export class emergencyContactService {
    constructor(
        private readonly emergencyContactRepository: EmergencyContactRepository
    ) { }

    async create(data: EmergencyContactDto) {
        if (!data) {
            throw new Error("Datos faltantes");
        }

        const result = this.emergencyContactRepository.createEmergencyContact(data);

        if (!result) {
            throw new Error("Error al crear la cuenta");
        }

        return result;
    }

    async(data: EmergencyContactDto) {

    }

    async getById(id: string) {

    }

    async getByEmail(email: string) {

    }

    async update(data: EmergencyContactDto) {

    }

    async delete(id: string) {

    }
}
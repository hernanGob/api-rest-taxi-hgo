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

    async getById(id: string) {
        if (!id) {
            throw new Error("Parámetro no válido");
        }

        const result = this.emergencyContactRepository.findById(id);

        if (!result) {
            throw new Error("No se pudo obtener lo datos del contacto de emergencia");
        }

        return result;
    }

    async getByEmail(email: string) {
        if (!email) {
            throw new Error("Parámetro no válido");
        }

        const result = this.emergencyContactRepository.findByEmail(email);

        if (!result) {
            throw new Error("No se pudo obtener lo datos del contacto de emergencia");
        }

        return result;
    }

    async update(data: EmergencyContactDto) {
        if (!data) {
            throw new Error("Datos faltantes");
        }

        const result = this.emergencyContactRepository.updateEmergencyContact(data);

        if (!result) {
            throw new Error("Error al actualizar la información");
        }

        return result;
    }

    async delete(id: string) {
        if (!id) {
            throw new Error("Parámetro no válido");
        }

        const result = this.emergencyContactRepository.deleteEmergencyContact(id);

        if (!result) {
            throw new Error("Error al eliminar al contacto de emergencia");
        }

        return result;
    }
}
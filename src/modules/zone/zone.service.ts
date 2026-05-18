import validator from "validator";
import { generateUUID } from "../../utils/uuid.js";
import type { ZoneRepository } from "./zone.repo.js";
import type { MunicipalityFilters, ZoneDto, ZoneUpdateDto } from "./zone.types.js";

export class ZoneService {
    constructor(private readonly zoneRepository: ZoneRepository) { }

    async listZones(params: { active?: boolean }) {
        return this.zoneRepository.listZones(params);
    }

    async createZone(data: ZoneDto) {
        if (!data.name || validator.isEmpty(data.name.trim())) {
            throw new Error("El nombre de la zona es requerido");
        }

        const exists = await this.zoneRepository.findByName(data.name.trim());

        if (exists) {
            throw new Error("Ya existe una zona con ese nombre");
        }

        const result = await this.zoneRepository.createZone({
            id: generateUUID(),
            name: data.name.trim(),
            isActive: data.isActive ?? true,
        });

        if (!result) {
            throw new Error("Error al crear la zona");
        }

        return result;
    }

    async updateZone(id: string, patch: ZoneUpdateDto) {
        if (!validator.isUUID(id)) {
            throw new Error("El id de la zona no es válido");
        }

        const exists = await this.zoneRepository.findById(id);

        if (!exists) {
            throw new Error("La zona no existe");
        }

        if (patch.name !== undefined && validator.isEmpty(patch.name.trim())) {
            throw new Error("El nombre de la zona no puede estar vacío");
        }

        const data: ZoneUpdateDto = {};

        if (patch.name !== undefined) {
            data.name = patch.name.trim();
        }

        if (patch.isActive !== undefined) {
            data.isActive = patch.isActive;
        }

        const result = await this.zoneRepository.updateZone(id, data);

        if (!result) {
            throw new Error("Error al actualizar la zona");
        }

        return result;
    }

    async setZoneActive(id: string, isActive: boolean) {
        return this.updateZone(id, { isActive });
    }

    async listMunicipalities(filters: MunicipalityFilters) {
        if (filters.zoneId && !validator.isUUID(filters.zoneId)) {
            throw new Error("El zoneId no es válido");
        }

        return this.zoneRepository.listMunicipalities(filters);
    }

    async setMunicipalityZone(
        municipalityId: string,
        data: { zoneId?: string | null }
    ) {
        if (!validator.isUUID(municipalityId)) {
            throw new Error("El id del municipio no es válido");
        }

        if (data.zoneId && !validator.isUUID(data.zoneId)) {
            throw new Error("El zoneId no es válido");
        }

        const result = await this.zoneRepository.setMunicipalityZone(
            municipalityId,
            data.zoneId ?? null
        );

        if (!result) {
            throw new Error("No se pudo actualizar el municipio");
        }

        return result;
    }

    async bulkAssignMunicipalitiesToZone(
        zoneId: string,
        data: { municipalityIds?: string[]; sync?: boolean }
    ) {
        if (!validator.isUUID(zoneId)) {
            throw new Error("El id de la zona no es válido");
        }

        if (!Array.isArray(data.municipalityIds)) {
            throw new Error("municipalityIds debe ser un arreglo");
        }

        for (const id of data.municipalityIds) {
            if (!validator.isUUID(id)) {
                throw new Error(`Municipio inválido: ${id}`);
            }
        }

        const assigned = await this.zoneRepository.bulkSetMunicipalitiesZone(
            zoneId,
            data.municipalityIds
        );

        let removed: Array<{ id: string; zoneId: string | null }> = [];

        if (data.sync === true) {
            removed = await this.zoneRepository.bulkSyncZoneMunicipalities(
                zoneId,
                data.municipalityIds
            );
        }

        return {
            assigned,
            removed,
        };
    }
}
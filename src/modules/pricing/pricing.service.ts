import validator from "validator";
import type { PricingRepository } from "./pricing.repo.js";
import type {
    PricingConfigDto,
    PricingConfigFilters,
    PricingConfigUpdateDto,
    PricingScope,
} from "./pricing.types.js";

const VALID_SCOPES: PricingScope[] = ["GLOBAL", "ZONE", "MUNICIPALITY"];

export class PricingService {
    constructor(private readonly pricingRepository: PricingRepository) { }

    async listPricingConfigs(filters: PricingConfigFilters) {
        return this.pricingRepository.listPricingConfigs(filters);
    }

    async createPricingConfig(data: PricingConfigDto) {
        if (!VALID_SCOPES.includes(data.scope)) {
            throw new Error("El scope no es válido");
        }

        if (data.scope === "GLOBAL") {
            data.zoneId = null;
            data.municipalityId = null;
        }

        if (data.scope === "ZONE" && !data.zoneId) {
            throw new Error("El zoneId es requerido para tarifas por zona");
        }

        if (data.scope === "MUNICIPALITY" && !data.municipalityId) {
            throw new Error("El municipalityId es requerido para tarifas por municipio");
        }

        if (data.zoneId && !validator.isUUID(data.zoneId)) {
            throw new Error("El zoneId no es válido");
        }

        if (data.municipalityId && !validator.isUUID(data.municipalityId)) {
            throw new Error("El municipalityId no es válido");
        }

        if (data.baseFare < 0 || data.perMinute < 0 || data.perKm < 0) {
            throw new Error("Las tarifas no pueden ser negativas");
        }

        if (data.isActive ?? true) {
            await this.pricingRepository.deactivateSameScope({
                scope: data.scope,
                zoneId: data.zoneId ?? null,
                municipalityId: data.municipalityId ?? null,
            });
        }

        const result = await this.pricingRepository.createPricingConfig(data);

        if (!result) {
            throw new Error("Error al crear la configuración de tarifa");
        }

        return result;
    }

    async updatePricingConfig(id: string, patch: PricingConfigUpdateDto) {
        if (!validator.isUUID(id)) {
            throw new Error("El id no es válido");
        }

        const exists = await this.pricingRepository.findById(id);

        if (!exists) {
            throw new Error("La configuración de tarifa no existe");
        }

        if (
            patch.baseFare !== undefined &&
            patch.baseFare < 0
        ) {
            throw new Error("La tarifa base no puede ser negativa");
        }

        if (
            patch.perMinute !== undefined &&
            patch.perMinute < 0
        ) {
            throw new Error("La tarifa por minuto no puede ser negativa");
        }

        if (
            patch.perKm !== undefined &&
            patch.perKm < 0
        ) {
            throw new Error("La tarifa por kilómetro no puede ser negativa");
        }

        const result = await this.pricingRepository.updatePricingConfig(id, patch);

        if (!result) {
            throw new Error("Error al actualizar la configuración de tarifa");
        }

        return result;
    }

    async resolvePricing(municipalityId: string) {
        if (!municipalityId || !validator.isUUID(municipalityId)) {
            throw new Error("El municipalityId no es válido");
        }

        const result = await this.pricingRepository.resolvePricingForMunicipality(
            municipalityId
        );

        if (!result) {
            throw new Error("No se encontró una tarifa activa");
        }

        return result;
    }

    async getGlobalPricing() {
        const result = await this.pricingRepository.getActiveGlobalPricing();

        if (!result) {
            throw new Error("No hay tarifa global activa");
        }

        return result;
    }
}
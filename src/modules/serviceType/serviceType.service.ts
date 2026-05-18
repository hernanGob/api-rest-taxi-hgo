import type { ServiceTypeRepository } from "./serviceType.repo.js";

export class ServiceTypeService {
    constructor(private readonly serviceTypeRepository: ServiceTypeRepository) { }

    async listServiceTypes() {
        return this.serviceTypeRepository.listServiceTypes();
    }
}
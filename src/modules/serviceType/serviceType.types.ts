export interface ServiceType {
    id: number;
    name: string;
    increasePercentage: string;
}

export interface ServiceTypeRow {
    id: number;
    name: string;
    increase_percentage: string;
}

export interface IServiceTypeRepository {
    listServiceTypes(): Promise<ServiceType[]>;
}
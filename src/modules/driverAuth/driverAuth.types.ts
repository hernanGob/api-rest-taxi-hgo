export interface DriverAuth {
    id: string;
    idoperador: number;
    password: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DriverAuthRow {
    id: string;
    id_operador: number;
    password: string | null;
    created_at: string;
    updated_at: string;
}

export interface IDriverAuthRepository {
    findByIdOperador(idoperador: number): Promise<DriverAuth | null>;

    createDriverAuth(data: {
        id: string;
        idoperador: number;
        password: string | null;
    }): Promise<DriverAuth | null>;

    updatePassword(
        idoperador: number,
        password: string
    ): Promise<DriverAuth | null>;
}
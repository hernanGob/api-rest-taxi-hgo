export interface DriverAuth {
    id: string;
    idoperador: number;
    password: string | null;
    createdAt: string;
    updatedAt: string;
    isSuspended: boolean;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    imagenPerfil: string;
}

export interface DriverAuthRow {
    id: string;
    id_operador: number;
    password: string | null;
    created_at: string;
    updated_at: string;
    is_suspended: boolean;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    imagen_perfil: string;
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
import { config } from "../../config/config.js";
import type { StchAuthService } from "../stch/stchAuth.service.js";

type ExternalDriver = {
    idoperador: number;
    fechavencimiento: string | null;
    municipio: string | null;
    nombre: string | null;
    apellidopaterno: string | null;
    apellidomaterno: string | null;
    datos?: string | null;
};

type ExternalDriversResponse = {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    datos: ExternalDriver[];
};

const BASE_URL = config.API_STCH;

export class DriverService {
    constructor(
        private readonly stchAuthService: StchAuthService
    ) { }

    private async fetchDriversPage(token: string, pagina: number, limite: number) {
        const response = await fetch(
            `${BASE_URL}/operadores?pagina=${pagina}&limite=${limite}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        if (response.status === 401) {
            throw Object.assign(new Error("Token expirado o inválido"), { code: 401 });
        }

        if (!response.ok) {
            const raw = await response.text();
            throw new Error(`Error al consultar operadores: HTTP ${response.status} - ${raw}`);
        }

        return (await response.json()) as ExternalDriversResponse;
    }

    async fetchDriversPageWithRetry(pagina: number, limite: number) {
        try {
            let token = await this.stchAuthService.getValidStchToken();

            try {
                return await this.fetchDriversPage(token, pagina, limite);
            } catch (error: any) {
                if (error?.code === 401) {
                    this.stchAuthService.clearStchTokenCache();
                    token = await this.stchAuthService.getValidStchToken();
                    return await this.fetchDriversPage(token, pagina, limite);
                }
                throw error;
            }
        } catch (error) {
            console.error("Error en fetchDriversPageWithRetry:", error);
            throw error;
        }
    }

    async listDrivers(page = 1, limit = 10) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

            const apiResponse = await this.fetchDriversPageWithRetry(safePage, safeLimit);

            const drivers = (apiResponse.datos ?? []).map((item) => ({
                id: item.idoperador,
                first_name: item.nombre ?? "",
                paternal_surname: item.apellidopaterno ?? "",
                maternal_surname: item.apellidomaterno ?? "",
                expiration_date: item.fechavencimiento ?? "",
                municipality: item.municipio ?? "",
                profile_picture: item.datos ?? "",
            }));

            return {
                ok: true,
                status: "success" as const,
                statusCode: 200,
                msg: "Conductores obtenidos correctamente",
                data: drivers,
                page: Number(apiResponse.pagina ?? safePage),
                limit: Number(apiResponse.limite ?? safeLimit),
                total: Number(apiResponse.total ?? 0),
                totalPages: Number(apiResponse.totalPaginas ?? 1),
            };
        } catch (error) {
            console.error("Error listDrivers:", error);

            return {
                ok: false,
                status: "error" as const,
                statusCode: 500,
                msg: "Error al mostrar la información de los conductores",
                data: [],
                page,
                limit,
                total: 0,
                totalPages: 1,
            };
        }
    }

    async findDriverById(idoperador: number) {
        try {
            const token = await this.stchAuthService.getValidStchToken();
            const response = await fetch(
                `${BASE_URL}/operadores?idoperador=${idoperador}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (response.status === 401) {
                throw Object.assign(new Error("Token expirado o inválido"), { code: 401 });
            }

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                const raw = await response.text();
                throw new Error(`HTTP ${response.status} - ${raw}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data[0] : data;

        } catch (error: any) {
            if (error?.code === 401) {
                this.stchAuthService.clearStchTokenCache();
                const newToken = await this.stchAuthService.getValidStchToken();
                const retryResponse = await fetch(
                    `${BASE_URL}/operadores?idoperador=${idoperador}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${newToken}`,
                            Accept: "application/json",
                        },
                    }
                );
                if (retryResponse.ok) {
                    const data = await retryResponse.json();
                    return Array.isArray(data) ? data[0] : data;
                }
            }
            console.error(`Error buscando driver ${idoperador}:`, error);
            throw error;
        }
    }
}
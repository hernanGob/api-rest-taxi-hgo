import { config } from "../../config/config.js";
import { getValidStchToken, clearStchTokenCache } from "./stch.service.js";

type DriverApiItem = {
    idoperador: number;
    fechavencimiento: string | null;
    municipio: string | null;
    nombre: string | null;
    apellidopaterno: string | null;
    apellidomaterno: string | null;
    datos?: string | null;
};

type DriversApiResponse = {
    limite: number;
    total: number;
    totalPaginas: number;
    datos: DriverApiItem[];
};

const BASE_URL = config.API_STCH;

async function fetchDriversPage(
    token: string,
    pagina: number,
    limite = 100
): Promise<DriversApiResponse> {
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
        throw Object.assign(new Error("Token expirado o no autorizado"), {
            code: 401,
        });
    }

    if (!response.ok) {
        throw new Error(`Error al consultar operadores: HTTP ${response.status}`);
    }

    const data = (await response.json()) as DriversApiResponse;

    if (!data || !Array.isArray(data.datos)) {
        throw new Error("Formato inválido en respuesta de operadores");
    }

    return data;
}

async function fetchDriversPageWithRetry(
    pagina: number,
    limite = 100
): Promise<DriversApiResponse> {
    let token = await getValidStchToken();

    try {
        return await fetchDriversPage(token, pagina, limite);
    } catch (error: any) {
        if (error?.code === 401) {
            clearStchTokenCache();
            token = await getValidStchToken();
            return await fetchDriversPage(token, pagina, limite);
        }
        throw error;
    }
}

export class StchDriverService {
    constructor() {

    }

    async listDrivers() {
        try {
            const firstPage = await fetchDriversPageWithRetry(1, 100);

            const totalPaginas = Number(firstPage.totalPaginas || 1);
            const allDrivers: DriverApiItem[] = [...firstPage.datos];

            // Puedes dejarlo secuencial o en paralelo limitado.
            // Para no castigar tanto el servicio externo, aquí lo dejo secuencial.
            for (let pagina = 2; pagina <= totalPaginas; pagina++) {
                const pageData = await fetchDriversPageWithRetry(pagina, 100);
                allDrivers.push(...pageData.datos);
            }

            const drivers = allDrivers.map((item) => ({
                id: item.idoperador,
                nombre: item.nombre,
                apellidoPaterno: item.apellidopaterno,
                apellidoMaterno: item.apellidomaterno,
                nombreCompleto: [
                    item.nombre,
                    item.apellidopaterno,
                    item.apellidomaterno,
                ]
                    .filter(Boolean)
                    .join(" "),
                municipio: item.municipio,
                fechaVencimiento: item.fechavencimiento,
                fotoBase64: item.datos ?? null,
            }));

            return {
                ok: true,
                status: "success" as const,
                statusCode: 200,
                msg: "Conductores obtenidos correctamente",
                data: drivers,
                total: drivers.length,
            };
        } catch (error) {
            console.error("Error listDrivers:", error);

            return {
                ok: false,
                status: "error" as const,
                statusCode: 500,
                msg: "Error al mostrar la información de los conductores",
            };
        }
    };
}
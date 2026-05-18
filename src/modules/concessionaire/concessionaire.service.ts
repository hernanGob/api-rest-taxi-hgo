import { config } from "../../config/config.js";
import type { StchAuthService } from "../stch/stchAuth.service.js";

type ExternalConcessionaire = {
  idconcesion: number;
  esconcesion: string | null;
  mnemotecnia: string | null;
  nombre: string | null;
  apellidopaterno: string | null;
  apellidomaterno: string | null;
  rfc: string | null;
  anio: string | null;
  idruta: string | null;
  serieplaca: string | null;
  modalidad: string | null;
  submodalidad: string | null;
  idmunicipioautorizado: string | null;
  marca: string | null;
  submarca: string | null;
  municipio: string | null;
  idestatus: string | null;
  puntuacion: string | null;
  datos?: string | null;
};

type ExternalConcessionaireResponse = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  datos: ExternalConcessionaire[];
};

const BASE_URL = config.API_STCH;

export class ConcessionaireService {
  constructor(private readonly stchAuthService: StchAuthService) {}

  private async fetchConcessionairePage(
    token: string,
    pagina: number,
    limite: number
  ) {
    const response = await fetch(
      `${BASE_URL}/concesiones?pagina=${pagina}&limite=${limite}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      throw Object.assign(new Error("Token expirado o inválido"), {
        code: 401,
      });
    }

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(
        `Error al consultar concesionarios: HTTP ${response.status} - ${raw}`
      );
    }

    return (await response.json()) as ExternalConcessionaireResponse;
  }

  private async fetchConcessionairePageWithRetry(
    pagina: number,
    limite: number
  ) {
    try {
      let token = await this.stchAuthService.getValidStchToken();

      try {
        return await this.fetchConcessionairePage(token, pagina, limite);
      } catch (error: any) {
        if (error?.code === 401) {
          this.stchAuthService.clearStchTokenCache();
          token = await this.stchAuthService.getValidStchToken();

          return await this.fetchConcessionairePage(token, pagina, limite);
        }

        throw error;
      }
    } catch (error) {
      console.error("Error en fetchConcessionairePageWithRetry:", error);
      throw error;
    }
  }

  async listConcessionaires(page = 1, limit = 10) {
    try {
      const safePage =
        Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

      const apiResponse = await this.fetchConcessionairePageWithRetry(
        safePage,
        safeLimit
      );

      return {
        ok: true,
        status: "success" as const,
        statusCode: 200,
        msg: "Concesionarios obtenidos correctamente",
        data: apiResponse.datos,
        page: Number(apiResponse.pagina ?? safePage),
        limit: Number(apiResponse.limite ?? safeLimit),
        total: Number(apiResponse.total ?? 0),
        totalPages: Number(apiResponse.totalPaginas ?? 1),
      };
    } catch (error) {
      console.error("Error listConcessionaires:", error);

      return {
        ok: false,
        status: "error" as const,
        statusCode: 500,
        msg: "Error al mostrar la información de los concesionarios",
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 1,
      };
    }
  }
}
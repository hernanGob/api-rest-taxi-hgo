import { config } from "../../config/config.js";

type LoginApiResponse = {
    success: boolean;
    token: string;
    usuario: string;
};

const STCH_API = config.API_STCH
const STCH_USER = config.STCH_USER;
const STCH_PASSWORD = config.STCH_PASSWORD;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let loginPromise: Promise<string> | null = null;

export class StchAuthService {
    constructor() { }

    parseJwtExpiration(token: string): number | null {
        try {
            const payloadBase64 = token.split(".")[1];
            if (!payloadBase64) return null;

            const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
            const payload = JSON.parse(payloadJson);

            if (!payload?.exp) return null;

            return Number(payload.exp) * 1000;
        } catch {
            return null;
        }
    }

    async loginStch(): Promise<string> {
        const response = await fetch(`${STCH_API}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                usuario: STCH_USER,
                contrasena: STCH_PASSWORD,
            }),
        });

        const raw = await response.text();

        if (!response.ok) {
            console.error("[STCH LOGIN ERROR]", {
                status: response.status,
                body: raw,
                STCH_API,
                STCH_USER,
                hasPassword: Boolean(STCH_PASSWORD),
            });

            throw Object.assign(
                new Error(`Error en login STCH: HTTP ${response.status}`),
                { code: response.status }
            );
        }

        const data = JSON.parse(raw) as LoginApiResponse;

        if (!data?.success || !data?.token) {
            throw new Error("No se pudo obtener el token de STCH");
        }

        const exp = this.parseJwtExpiration(data.token);

        cachedToken = data.token;
        tokenExpiresAt = exp ? exp - 60_000 : Date.now() + 50 * 60_000;

        return data.token;
    }

    async getValidStchToken(): Promise<string> {
        if (!STCH_USER || !STCH_PASSWORD) {
            throw new Error("Faltan STCH_USER o STCH_PASSWORD en variables de entorno");
        }

        const now = Date.now();

        if (cachedToken && now < tokenExpiresAt) {
            return cachedToken;
        }

        if (loginPromise) {
            return loginPromise;
        }

        loginPromise = this.loginStch();

        try {
            return await loginPromise;
        } finally {
            loginPromise = null;
        }
    }

    clearStchTokenCache() {
        cachedToken = null;
        tokenExpiresAt = 0;
    }
}
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { type AuthenticatedSocket, type TokenPayload } from "./socket.types.js";
import { config } from "../config/config.js";

export function socketAuthMiddleware(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
) {
    try {
        let token: string | undefined;

        /**
         * Web admin:
         * El navegador manda cookies automáticamente.
         */
        const rawCookie = socket.handshake.headers.cookie;

        if (rawCookie) {
            const parsedCookies = cookie.parse(rawCookie);

            token =
                parsedCookies.admin_token ||
                parsedCookies.accessToken ||
                parsedCookies.token;
        }

        /**
         * React Native:
         * El token viene desde socket.auth.
         */
        if (!token && typeof socket.handshake.auth?.token === "string") {
            token = socket.handshake.auth.token;
        }

        if (!token) {
            return next(new Error("Unauthorized: No token provided"));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

        socket.user = decoded;

        return next();
    } catch (error) {
        return next(new Error("Unauthorized: Invalid token"));
    }
}
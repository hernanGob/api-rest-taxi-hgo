import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config/config.js";

export function authenticateOperador(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (req.method === "OPTIONS") {
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                ok: false,
                status: "error",
                msg: "Sesión inválida",
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                ok: false,
                status: "error",
                msg: "Sesión inválida",
            });
        }

        let decoded: string | JwtPayload;

        try {
            decoded = jwt.verify(token, config.JWT_SECRET);

            if (typeof decoded === 'string' || decoded.type !== 'driver') {
                return res.status(403).json({
                    ok: false,
                    status: "error",
                    msg: "Acceso denegado. Esta ruta es exclusiva para pasajeros",
                });
            }
        } catch {
            return res.status(401).json({
                ok: false,
                status: "expired",
                msg: "Sesión expirada",
            });
        }

        req.user = decoded;

        return next();
    } catch (error) {
        console.error(error);

        return res.status(403).json({
            ok: false,
            status: "error",
            msg: "Error al comprobar la sesión",
        });
    }
}
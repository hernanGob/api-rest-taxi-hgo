import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config/config.js";

export function authenticateTokenWeb(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (req.method === "OPTIONS") {
            return next();
        }

        const token = req.cookies?.admin_token;

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
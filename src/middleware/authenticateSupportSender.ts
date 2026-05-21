import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../config/config.js";

function verifyJwt(token: string): string | JwtPayload | null {
    try {
        return jwt.verify(token, config.JWT_SECRET);
    } catch {
        return null;
    }
}

function isJwtObject(decoded: string | JwtPayload): decoded is JwtPayload {
    return typeof decoded !== "string";
}

export function authenticateSupportSender(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (req.method === "OPTIONS") {
        return next();
    }

    const adminToken = req.cookies?.admin_token;

    if (adminToken) {
        const decoded = verifyJwt(adminToken);

        if (decoded && isJwtObject(decoded)) {
            req.user = {
                ...decoded,
                senderType: "admin",
            };

            return next();
        }
    }

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
        const passengerToken = authHeader.split(" ")[1];

        if (passengerToken) {
            const decoded = verifyJwt(passengerToken);

            if (
                decoded &&
                isJwtObject(decoded) &&
                decoded.type === "passenger"
            ) {
                req.user = {
                    ...decoded,
                    senderType: "passenger",
                };

                return next();
            }
        }
    }

    return res.status(401).json({
        ok: false,
        status: "error",
        msg: "Sesión inválida o expirada",
    });
}
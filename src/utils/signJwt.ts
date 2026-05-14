import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export interface TokenPayload {
    sub: string;
    rol?: number;
    area_id?: number;
}

export function signToken(payload: TokenPayload): string {
    const secret = config.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está definido");
    }

    return jwt.sign(payload, secret, {
        expiresIn: "1d",
    });
}
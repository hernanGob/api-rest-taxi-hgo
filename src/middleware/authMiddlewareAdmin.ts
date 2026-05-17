import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from '../config/config.js';


export function authenticateTokenWeb(req: Request, res: Response, next: NextFunction) {
    try {
        const cookie = req.cookies['admin_token'];

        // validar formato "Bearer <tokenEncriptado:iv>"
        if (!cookie) {
            return res.status(401).json({
                status: 'error',
                msg: 'Sesión inválida',
            });
        }

        let decoded: string | JwtPayload;
        try {
            decoded = jwt.verify(cookie, config.JWT_SECRET);
        } catch (err) {
            // expirado o inválido
            return res.status(401).json({
                status: 'error',
                msg: 'Sesión expirada',
            });
        }

        req.user = decoded;

        return next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({
            status: 'error',
            msg: 'Error al comprobar la sesión',
        });
    }
}

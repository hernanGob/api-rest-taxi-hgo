import { type Request, type Response, type NextFunction } from "express";
import type { UserService } from "./admin.service.js";
import { config } from "../../config/config.js";
import jwt from 'jsonwebtoken';

export class UserController {
    constructor(private readonly userService: UserService) { }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;

            const result = await this.userService.login({
                email: body.email,
                password: body.password,
            });

            res.cookie("admin_token", result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24,
            });

            return res.status(200).json({
                status: "success",
                msg: "Inicio de sesión correcto",
                data: result.user,
            });
        } catch (error) {
            next(error);
        }
    }

    verifySession(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies?.admin_token;

            if (!token) {
                return res.status(401).json({
                    status: "error",
                    msg: "Sesión no iniciada",
                });
            }

            const secret = config.JWT_SECRET;

            if (!secret) {
                return res.status(500).json({
                    status: "error",
                    msg: "JWT_SECRET no está definido",
                });
            }

            const payload = jwt.verify(token, secret);

            return res.status(200).json({
                status: "success",
            });
        } catch (error) {
            next(error);
        }
    }

    logOut(_req: Request, res: Response, next: NextFunction) {
        try {
            res.clearCookie("admin_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            return res.status(200).json({
                status: "success",
                msg: "Sesión cerrada correctamente",
            });
        } catch (error) {
            next(error);
        }
    }
}
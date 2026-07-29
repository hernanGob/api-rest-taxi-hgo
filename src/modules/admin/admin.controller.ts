import {
    type CookieOptions,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import type {
    UserService,
} from "./admin.service.js";

export class UserController {
    private readonly ADMIN_COOKIE_NAME = "admin_token";

    private readonly ADMIN_TEMP_COOKIE_NAME = "admin_temp_token";

    private readonly ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60 * 3;

    private readonly ADMIN_TEMP_DURATION_MS = 1000 * 60 * 5;

    private readonly cookieBaseOptions:
        CookieOptions = {
            httpOnly: true,
            secure:
                process.env.NODE_ENV ===
                "production",
            sameSite: "lax",
            path: "/",
        };

    private readonly adminCookieOptions:
        CookieOptions = {
            ...this.cookieBaseOptions,
            maxAge:
                this.ADMIN_SESSION_DURATION_MS,
        };

    private readonly tempCookieOptions:
        CookieOptions = {
            ...this.cookieBaseOptions,
            maxAge:
                this.ADMIN_TEMP_DURATION_MS,
        };

    private readonly clearCookieOptions:
        CookieOptions = {
            ...this.cookieBaseOptions,
        };

    constructor(
        private readonly userService:
            UserService,
    ) { }

    login = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const {
                email,
                password,
            } = req.body ?? {};

            const userAgent =
                req.get(
                    "user-agent",
                );

            const result =
                await this.userService
                    .login(
                        {
                            email:
                                String(
                                    email ?? "",
                                ),
                            password:
                                String(
                                    password ?? "",
                                ),
                        },
                        {
                            ip:
                                req.ip,

                            ...(userAgent
                                ? {
                                    userAgent,
                                }
                                : {}),
                        },
                    );

            /*
             * Todavía no se crea admin_token.
             * Solo se guarda el token temporal.
             */
            res.clearCookie(
                this.ADMIN_COOKIE_NAME,
                this.clearCookieOptions,
            );

            res.cookie(
                this.ADMIN_TEMP_COOKIE_NAME,
                result.tempToken,
                this.tempCookieOptions,
            );

            return res.status(200).json({
                status:
                    "success",

                msg:
                    "Contraseña validada. Continúa con la autenticación de dos factores",

                data: {
                    requires2FA:
                        result.requires2FA,

                    requires2FASetup:
                        result.requires2FASetup,

                    user:
                        result.user,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    setupTwoFactor = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const tempToken =
                this.getTempToken(
                    req,
                );

            const result =
                await this.userService
                    .setupTwoFactor(
                        tempToken,
                    );

            return res.status(200).json({
                status:
                    "success",

                msg:
                    "Código QR generado correctamente",

                data:
                    result,
            });
        } catch (error) {
            next(error);
        }
    };

    verifyTwoFactorSetup = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const tempToken =
                this.getTempToken(
                    req,
                );

            const {
                code,
            } = req.body ?? {};

            if (!code) {
                return res
                    .status(400)
                    .json({
                        status:
                            "error",
                        msg:
                            "El código 2FA es obligatorio",
                    });
            }

            const userAgent =
                req.get(
                    "user-agent",
                );

            const result =
                await this.userService
                    .verifyTwoFactorSetup(
                        tempToken,
                        String(code),
                        {
                            ip:
                                req.ip,

                            ...(userAgent
                                ? {
                                    userAgent,
                                }
                                : {}),
                        },
                    );

            this.setFinalSessionCookie(
                res,
                result.token,
            );

            return res.status(200).json({
                status:
                    "success",

                msg:
                    "Autenticación de dos factores activada correctamente",

                data:
                    result.user,
            });
        } catch (error) {
            next(error);
        }
    };

    loginVerifyTwoFactor = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const tempToken =
                this.getTempToken(
                    req,
                );

            const {
                code,
            } = req.body ?? {};

            if (!code) {
                return res
                    .status(400)
                    .json({
                        status:
                            "error",
                        msg:
                            "El código 2FA es obligatorio",
                    });
            }

            const userAgent =
                req.get(
                    "user-agent",
                );

            const result =
                await this.userService
                    .verifyLoginTwoFactor(
                        tempToken,
                        String(code),
                        {
                            ip:
                                req.ip,

                            ...(userAgent
                                ? {
                                    userAgent,
                                }
                                : {}),
                        },
                    );

            this.setFinalSessionCookie(
                res,
                result.token,
            );

            return res.status(200).json({
                status:
                    "success",

                msg:
                    "Inicio de sesión correcto",

                data:
                    result.user,
            });
        } catch (error) {
            next(error);
        }
    };

    verifySession = async (
        req: Request,
        res: Response,
    ) => {
        try {
            const token =
                this.getAdminToken(
                    req,
                );

            const session =
                await this.userService
                    .verifySession(
                        token,
                    );

            return res.status(200).json({
                status:
                    "success",
                msg:
                    "Sesión activa",
                data: {
                    userId:
                        session.userId,
                    role:
                        session.role,
                },
            });
        } catch {
            this.clearAllAuthCookies(
                res,
            );

            return res.status(401).json({
                status:
                    "error",
                msg:
                    "La sesión expiró o ya no es válida",
            });
        }
    };

    logout = async (
        req: Request,
        res: Response,
    ) => {
        try {
            const token =
                req.cookies?.[
                this.ADMIN_COOKIE_NAME
                ];

            if (
                token &&
                typeof token ===
                "string"
            ) {
                try {
                    const session =
                        await this.userService
                            .verifySession(
                                token,
                            );

                    await this.userService
                        .logout(
                            session.userId,
                            session.sessionId,
                        );
                } catch {
                    /*
                     * Si el JWT ya expiró, igualmente
                     * se eliminan las cookies.
                     */
                }
            }

            this.clearAllAuthCookies(
                res,
            );

            return res.status(200).json({
                status:
                    "success",
                msg:
                    "Sesión cerrada correctamente",
            });
        } catch {
            this.clearAllAuthCookies(
                res,
            );

            return res.status(200).json({
                status:
                    "success",
                msg:
                    "Sesión cerrada correctamente",
            });
        }
    };

    logoutAll = async (
        req: Request,
        res: Response,
    ) => {
        try {
            const token =
                this.getAdminToken(
                    req,
                );

            const session =
                await this.userService
                    .verifySession(
                        token,
                    );

            await this.userService
                .logoutAll(
                    session.userId,
                );

            this.clearAllAuthCookies(
                res,
            );

            return res.status(200).json({
                status:
                    "success",
                msg:
                    "Todas las sesiones fueron cerradas correctamente",
            });
        } catch {
            this.clearAllAuthCookies(
                res,
            );

            return res.status(401).json({
                status:
                    "error",
                msg:
                    "La sesión expiró o ya no es válida",
            });
        }
    };

    resetTwoFactor = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const token =
                this.getAdminToken(
                    req,
                );

            const {
                currentPassword,
                code,
            } = req.body ?? {};

            if (
                !currentPassword ||
                !code
            ) {
                return res
                    .status(400)
                    .json({
                        status:
                            "error",
                        msg:
                            "La contraseña actual y el código 2FA son obligatorios",
                    });
            }

            await this.userService
                .resetTwoFactor(
                    token,
                    String(
                        currentPassword,
                    ),
                    String(code),
                );

            this.clearAllAuthCookies(
                res,
            );

            return res.status(200).json({
                status:
                    "success",
                msg:
                    "La autenticación de dos factores fue desactivada. Inicia sesión nuevamente",
            });
        } catch (error) {
            next(error);
        }
    };

    private getTempToken(
        req: Request,
    ): string {
        const token =
            req.cookies?.[
            this.ADMIN_TEMP_COOKIE_NAME
            ];

        if (
            !token ||
            typeof token !==
            "string"
        ) {
            throw new Error(
                "El token temporal no existe o expiró",
            );
        }

        return token;
    }

    private getAdminToken(
        req: Request,
    ): string {
        const token =
            req.cookies?.[
            this.ADMIN_COOKIE_NAME
            ];

        if (
            !token ||
            typeof token !==
            "string"
        ) {
            throw new Error(
                "Sesión no iniciada",
            );
        }

        return token;
    }

    private setFinalSessionCookie(
        res: Response,
        token: string,
    ): void {
        res.cookie(
            this.ADMIN_COOKIE_NAME,
            token,
            this.adminCookieOptions,
        );

        /*
         * El token temporal deja de ser necesario.
         */
        res.clearCookie(
            this.ADMIN_TEMP_COOKIE_NAME,
            this.clearCookieOptions,
        );
    }

    private clearAllAuthCookies(
        res: Response,
    ): void {
        res.clearCookie(
            this.ADMIN_COOKIE_NAME,
            this.clearCookieOptions,
        );

        res.clearCookie(
            this.ADMIN_TEMP_COOKIE_NAME,
            this.clearCookieOptions,
        );
    }
}
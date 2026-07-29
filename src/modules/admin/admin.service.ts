import jwt from "jsonwebtoken";
import validator from "validator";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

import { config } from "../../config/config.js";

import {
    comparePassword,
} from "../../utils/argon2.js";

import {
    signToken,
} from "../../utils/signJwt.js";

import {
    generateUUID,
} from "../../utils/uuid.js";

import { UserRepository } from "./admin.repo.js";

import type {
    LoginMetadata,
    User,
    UserLoginDto,
    VerifiedAdminSession,
} from "./admin.types.js";

import type {
    AdminRedisRepository,
} from "./admin.redis.repository.js";
import { AppError } from "../../shared/errors/appError.js";

type AdminTempTokenPayload = {
    sub: string;
    purpose: "admin_2fa_login";
};

export class UserService {
    private readonly maxLoginAttempts = 5;

    private readonly totpIssuer = `Taxi Hgo Admin ${config.nodeEnv === 'development' ? "Dev" : ""}`;

    constructor(
        private readonly userRepository: UserRepository,

        private readonly adminRedisRepository: AdminRedisRepository,
    ) { }

    async login(
        data: UserLoginDto,
        _metadata: LoginMetadata = {},
    ) {
        if (
            !data.email ||
            !data.password
        ) {
            throw new Error(
                "Correo electrónico y contraseña son obligatorios",
            );
        }

        const email = data.email
            .trim()
            .toLowerCase();

        if (!validator.isEmail(email)) {
            throw new Error(
                "El correo electrónico no tiene un formato válido",
            );
        }

        const isBlocked =
            await this.adminRedisRepository
                .isBlocked(email);

        if (isBlocked) {
            const remainingSeconds =
                await this.adminRedisRepository
                    .getBlockedTimeRemaining(
                        email,
                    );

            const remainingMinutes =
                Math.max(
                    Math.ceil(
                        remainingSeconds / 60,
                    ),
                    1,
                );

            throw new AppError(
                `Demasiados intentos fallidos. Intenta nuevamente en ${remainingMinutes} minuto${remainingMinutes === 1 ? "" : "s"}`,
                429,
                "too_many_attempts",
            );
        }

        const user =
            await this.userRepository
                .findByEmail(email);

        if (!user) {
            await this.adminRedisRepository
                .registerFailedAttempt(
                    email,
                );

            throw new AppError(
                "Correo electrónico o contraseña incorrectos",
                401,
                "invalid_credentials",
            );
        }

        if (!user.passwordHash) {
            throw new AppError(
                "El usuario no tiene contraseña registrada",
                401,
                "invalid_credentials",
            );
            /* throw new Error(
                "El usuario no tiene contraseña registrada",
            ); */
        }

        const validPassword =
            await comparePassword(
                data.password,
                user.passwordHash,
            );

        if (!validPassword) {
            const attemptResult =
                await this.adminRedisRepository
                    .registerFailedAttempt(
                        email,
                    );

            if (attemptResult.blocked) {
                throw new AppError(
                    "La cuenta fue bloqueada temporalmente por demasiados intentos fallidos",
                    429,
                    "too_many_attempts",
                );
            }

            const remainingAttempts =
                Math.max(
                    this.maxLoginAttempts -
                    attemptResult.attempts,
                    0,
                );

            throw new AppError(
                `Correo electrónico o contraseña incorrectos. Intentos restantes: ${remainingAttempts}`,
                401,
                "invalid_credentials",
            );
        }

        await this.adminRedisRepository
            .clearFailedAttempts(email);

        /*
         * Aquí todavía no se genera una sesión Redis.
         * Tampoco se genera el JWT final.
         */
        const tempToken =
            this.createTempToken(
                user.id,
            );

        return {
            requires2FA:
                user.twoFactorEnabled &&
                Boolean(
                    user.twoFactorSecret,
                ),

            requires2FASetup:
                !user.twoFactorEnabled ||
                !user.twoFactorSecret,

            tempToken,

            user: this.formatUser(user),
        };
    }

    async setupTwoFactor(
        tempToken: string,
    ) {
        const userId =
            this.verifyTempToken(
                tempToken,
            );

        const user =
            await this.userRepository
                .findById(userId);

        if (!user) {
            throw new Error(
                "Usuario no encontrado",
            );
        }

        if (
            user.twoFactorEnabled &&
            user.twoFactorSecret
        ) {
            throw new Error(
                "La autenticación de dos factores ya se encuentra activada",
            );
        }

        const secret =
            new OTPAuth.Secret();

        const totp =
            new OTPAuth.TOTP({
                issuer:
                    this.totpIssuer,
                label:
                    user.email,
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret,
            });

        const otpauth =
            totp.toString();

        const qrCode =
            await QRCode.toDataURL(
                otpauth,
                {
                    width: 300,
                    margin: 2,
                    errorCorrectionLevel:
                        "M",
                },
            );

        const saved =
            await this.userRepository
                .saveTwoFactorSecret(
                    user.id,
                    secret.base32,
                );

        if (!saved) {
            throw new Error(
                "No fue posible guardar la configuración 2FA",
            );
        }

        return {
            qrCode,
            otpauth,
            manualKey:
                secret.base32,
        };
    }

    async verifyTwoFactorSetup(
        tempToken: string,
        code: string,
        metadata: LoginMetadata = {},
    ) {
        const userId =
            this.verifyTempToken(
                tempToken,
            );

        const user =
            await this.userRepository
                .findById(userId);

        if (!user) {
            throw new Error(
                "Usuario no encontrado",
            );
        }

        if (!user.twoFactorSecret) {
            throw new Error(
                "Primero debes generar el código QR",
            );
        }

        if (user.twoFactorEnabled) {
            throw new Error(
                "La autenticación de dos factores ya se encuentra activada",
            );
        }

        const normalizedCode =
            this.normalizeCode(code);

        const valid =
            this.validateTotp(
                user.email,
                user.twoFactorSecret,
                normalizedCode,
            );

        if (!valid) {
            throw new Error(
                "Código 2FA inválido o expirado",
            );
        }

        const enabled =
            await this.userRepository
                .enableTwoFactor(
                    user.id,
                );

        if (!enabled) {
            throw new Error(
                "No fue posible activar la autenticación de dos factores",
            );
        }

        const updatedUser =
            await this.userRepository
                .findById(user.id);

        if (!updatedUser) {
            throw new Error(
                "No fue posible obtener el usuario actualizado",
            );
        }

        return this.createAuthenticatedSession(
            updatedUser,
            metadata,
        );
    }

    async verifyLoginTwoFactor(
        tempToken: string,
        code: string,
        metadata: LoginMetadata = {},
    ) {
        const userId =
            this.verifyTempToken(
                tempToken,
            );

        const user =
            await this.userRepository
                .findById(userId);

        if (!user) {
            throw new Error(
                "Usuario no encontrado",
            );
        }

        if (
            !user.twoFactorEnabled ||
            !user.twoFactorSecret
        ) {
            throw new Error(
                "La autenticación de dos factores no se encuentra configurada",
            );
        }

        const normalizedCode =
            this.normalizeCode(code);

        const valid =
            this.validateTotp(
                user.email,
                user.twoFactorSecret,
                normalizedCode,
            );

        if (!valid) {
            throw new Error(
                "Código 2FA inválido o expirado",
            );
        }

        return this.createAuthenticatedSession(
            user,
            metadata,
        );
    }

    private async createAuthenticatedSession(
        user: User,
        metadata: LoginMetadata,
    ) {
        if (!user.userRole) {
            throw new Error(
                "El usuario no tiene un rol válido",
            );
        }

        const sessionId =
            generateUUID();

        await this.adminRedisRepository
            .createSession({
                sessionId,
                userId:
                    user.id,
                userRoleId:
                    user.userRoleId,
                email:
                    user.email,

                ...(metadata.ip
                    ? {
                        ip:
                            metadata.ip,
                    }
                    : {}),

                ...(metadata.userAgent
                    ? {
                        userAgent:
                            metadata.userAgent,
                    }
                    : {}),

                createdAt:
                    new Date()
                        .toISOString(),
            });

        const token =
            signToken({
                sub:
                    user.id,
                sid:
                    sessionId,
                rol:
                    user.userRole,
            });

        return {
            token,
            user:
                this.formatUser(
                    user,
                ),
        };
    }

    private createTempToken(
        userId: string,
    ): string {
        const secret =
            this.getJwtSecret();

        return jwt.sign(
            {
                sub:
                    userId,
                purpose:
                    "admin_2fa_login",
            } satisfies AdminTempTokenPayload,
            secret,
            {
                expiresIn: "5m",
            },
        );
    }

    private verifyTempToken(
        token: string,
    ): string {
        const secret =
            this.getJwtSecret();

        const decoded =
            jwt.verify(
                token,
                secret,
            );

        if (
            !decoded ||
            typeof decoded ===
            "string"
        ) {
            throw new Error(
                "El token temporal no es válido",
            );
        }

        const payload =
            decoded as Record<
                string,
                unknown
            >;

        if (
            typeof payload.sub !==
            "string" ||
            !payload.sub
        ) {
            throw new Error(
                "El token temporal no contiene un usuario válido",
            );
        }

        if (
            payload.purpose !==
            "admin_2fa_login"
        ) {
            throw new Error(
                "El token temporal no tiene un propósito válido",
            );
        }

        return payload.sub;
    }

    private normalizeCode(
        code: string,
    ): string {
        const normalized =
            String(code ?? "")
                .replace(/\s/g, "");

        if (
            !/^\d{6}$/.test(
                normalized,
            )
        ) {
            throw new Error(
                "El código 2FA debe contener exactamente 6 dígitos",
            );
        }

        return normalized;
    }

    private validateTotp(
        email: string,
        secret: string,
        code: string,
    ): boolean {
        const totp =
            new OTPAuth.TOTP({
                issuer:
                    this.totpIssuer,
                label:
                    email,
                algorithm: "SHA1",
                digits: 6,
                period: 30,

                secret:
                    OTPAuth.Secret
                        .fromBase32(
                            secret,
                        ),
            });

        const delta =
            totp.validate({
                token:
                    code,
                window:
                    1,
            });

        return delta !== null;
    }

    private getJwtSecret(): string {
        const secret =
            config.JWT_SECRET;

        if (!secret) {
            throw new Error(
                "JWT_SECRET no está definido",
            );
        }

        return secret;
    }

    private formatUser(
        user: User,
    ) {
        return {
            id:
                user.id,
            name:
                user.name,
            paternalSurname:
                user.paternalSurname,
            maternalSurname:
                user.maternalSurname,
            phone:
                user.phone,
            email:
                user.email,
            userRoleId:
                user.userRoleId,
            userRole:
                user.userRole,
            twoFactorEnabled:
                user.twoFactorEnabled,
            twoFactorEnabledAt:
                user.twoFactorEnabledAt,
        };
    }

    async verifySession(
        token: string,
    ): Promise<VerifiedAdminSession> {
        const decoded =
            jwt.verify(
                token,
                this.getJwtSecret(),
            );

        if (
            !decoded ||
            typeof decoded ===
            "string"
        ) {
            throw new Error(
                "El token de sesión no es válido",
            );
        }

        const payload =
            decoded as Record<
                string,
                unknown
            >;

        const userId =
            payload.sub;

        const sessionId =
            payload.sid;

        const role =
            payload.rol;

        if (
            typeof userId !==
            "string" ||
            !userId
        ) {
            throw new Error(
                "El token no contiene un usuario válido",
            );
        }

        if (
            typeof sessionId !==
            "string" ||
            !sessionId
        ) {
            throw new Error(
                "El token no contiene una sesión válida",
            );
        }

        if (
            typeof role !==
            "string" ||
            !role
        ) {
            throw new Error(
                "El token no contiene un rol válido",
            );
        }

        const redisSession =
            await this.adminRedisRepository
                .getSession(
                    sessionId,
                );

        if (!redisSession) {
            throw new Error(
                "La sesión expiró o fue revocada",
            );
        }

        if (
            redisSession.userId !==
            userId
        ) {
            throw new Error(
                "La sesión no pertenece al usuario autenticado",
            );
        }

        return {
            userId,
            sessionId,
            role,
        };
    }

    async resetTwoFactor(
        authToken: string,
        currentPassword: string,
        code: string,
    ) {
        const session =
            await this.verifySession(
                authToken,
            );

        const user =
            await this.userRepository
                .findById(
                    session.userId,
                );

        if (
            !user ||
            !user.passwordHash
        ) {
            throw new Error(
                "Usuario no encontrado",
            );
        }

        const validPassword =
            await comparePassword(
                currentPassword,
                user.passwordHash,
            );

        if (!validPassword) {
            throw new Error(
                "La contraseña actual es incorrecta",
            );
        }

        if (
            !user.twoFactorEnabled ||
            !user.twoFactorSecret
        ) {
            throw new Error(
                "La autenticación de dos factores no se encuentra activada",
            );
        }

        const validCode =
            this.validateTotp(
                user.email,
                user.twoFactorSecret,
                this.normalizeCode(
                    code,
                ),
            );

        if (!validCode) {
            throw new Error(
                "Código 2FA inválido o expirado",
            );
        }

        const cleared =
            await this.userRepository
                .clearTwoFactorConfiguration(
                    user.id,
                );

        if (!cleared) {
            throw new Error(
                "No fue posible desactivar la autenticación de dos factores",
            );
        }

        /*
         * Se cierran todas las sesiones para que
         * el usuario tenga que iniciar nuevamente.
         */
        await this.logoutAll(
            user.id,
        );

        return true;
    }

    async logout(
        userId: string,
        sessionId: string,
    ) {
        await this.adminRedisRepository
            .deleteSession(
                sessionId,
                userId,
            );

        return {
            message:
                "Sesión cerrada correctamente",
        };
    }

    async logoutAll(
        userId: string,
    ) {
        await this.adminRedisRepository
            .deleteAllUserSessions(
                userId,
            );

        return {
            message:
                "Todas las sesiones fueron cerradas correctamente",
        };
    }
}
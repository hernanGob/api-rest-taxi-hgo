
import type { AppRedisClient } from "../../shared/redis/redis.client.js";
import { REDIS_PREFIX } from "../../shared/redis/redis.constants.js";

type AdminSessionData = {
    sessionId: string;
    userId: string;
    userRoleId: string;
    email: string;
    ip?: string | undefined;
    userAgent?: string | undefined;
    createdAt: string;
};

type FailedAttemptResult = {
    attempts: number;
    blocked: boolean;
    remainingAttempts: number;
};

export class AdminRedisRepository {
    private readonly prefix = REDIS_PREFIX;
    private readonly maxLoginAttempts = 5;
    private readonly attemptsTtlSeconds = 15 * 60;
    private readonly sessionTtlSeconds = 60 * 60 * 3;

    constructor(
        private readonly redisClient: AppRedisClient,
    ) { }

    private buildKey(key: string): string {
        return `${this.prefix}:${key}`;
    }

    private getAttemptsKey(email: string): string {
        return this.buildKey(
            `admin:login-attempts:${email}`
        );
    }

    private getBlockedKey(email: string): string {
        return this.buildKey(
            `admin:locked:${email}`
        );
    }

    private getSessionKey(sessionId: string): string {
        return this.buildKey(
            `admin:session:${sessionId}`
        );
    }

    private getUserSessionsKey(userId: string): string {
        return this.buildKey(
            `admin:user-sessions:${userId}`
        );
    }

    async isBlocked(email: string): Promise<boolean> {
        const blocked = await this.redisClient.exists(
            this.getBlockedKey(email)
        );

        return blocked === 1;
    }

    async getBlockedTimeRemaining(email: string): Promise<number> {
        const ttl = await this.redisClient.ttl(
            this.getBlockedKey(email)
        );

        return Math.max(ttl, 0);
    }

    async registerFailedAttempt(email: string): Promise<FailedAttemptResult> {
        const attemptsKey = this.getAttemptsKey(email);
        const blockedKey = this.getBlockedKey(email);
        const attempts = await this.redisClient.incr(attemptsKey);

        /*
         * Cuando se crea el contador, se configura
         * su tiempo de expiración.
         */
        if (attempts === 1) {
            await this.redisClient.expire(
                attemptsKey,
                this.attemptsTtlSeconds
            );
        }

        const blocked = attempts >= this.maxLoginAttempts;
        if (blocked) {
            await this.redisClient
                .multi()
                .set(
                    blockedKey,
                    "1",
                    {
                        expiration: {
                            type: "EX",
                            value: this.attemptsTtlSeconds,
                        }
                    }
                )
                .del(attemptsKey)
                .exec();
        }

        return {
            attempts,
            blocked,
            remainingAttempts: Math.max(
                this.maxLoginAttempts - attempts,
                0
            ),
        }
    }

    async clearFailedAttempts(
        email: string
    ): Promise<void> {
        await this.redisClient
            .multi()
            .del(this.getAttemptsKey(email))
            .del(this.getBlockedKey(email))
            .exec();
    }

    async createSession(
        session: AdminSessionData
    ): Promise<void> {
        const sessionKey =
            this.getSessionKey(session.sessionId);

        const userSessionsKey =
            this.getUserSessionsKey(session.userId);

        await this.redisClient
            .multi()
            .set(
                sessionKey,
                JSON.stringify(session),
                {
                    EX: this.sessionTtlSeconds,
                }
            )
            .sAdd(
                userSessionsKey,
                session.sessionId
            )
            .expire(
                userSessionsKey,
                this.sessionTtlSeconds
            )
            .exec();
    }

    async getSession(
        sessionId: string
    ): Promise<AdminSessionData | null> {
        const sessionKey =
            this.getSessionKey(sessionId);

        const storedSession =
            await this.redisClient.get(sessionKey);

        if (!storedSession) {
            return null;
        }

        try {
            return JSON.parse(
                storedSession
            ) as AdminSessionData;
        } catch {
            await this.redisClient.del(sessionKey);

            return null;
        }
    }

    async sessionExists(
        sessionId: string
    ): Promise<boolean> {
        const exists = await this.redisClient.exists(
            this.getSessionKey(sessionId)
        );

        return exists === 1;
    }

    async deleteSession(
        sessionId: string,
        userId: string
    ): Promise<void> {
        await this.redisClient
            .multi()
            .del(this.getSessionKey(sessionId))
            .sRem(
                this.getUserSessionsKey(userId),
                sessionId
            )
            .exec();
    }

    async deleteAllUserSessions(
        userId: string
    ): Promise<void> {
        const userSessionsKey =
            this.getUserSessionsKey(userId);

        const sessionIds =
            await this.redisClient.sMembers(
                userSessionsKey
            );

        if (sessionIds.length === 0) {
            await this.redisClient.del(
                userSessionsKey
            );

            return;
        }

        const sessionKeys = sessionIds.map(
            (sessionId) =>
                this.getSessionKey(sessionId)
        );

        await this.redisClient
            .multi()
            .del(sessionKeys)
            .del(userSessionsKey)
            .exec();
    }
}
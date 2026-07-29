import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import type { Server } from "socket.io";

import { config } from "../../config/config.js";

type SocketRedisClient = ReturnType<typeof createClient>;

let socketPubClient: SocketRedisClient | null = null;
let socketSubClient: SocketRedisClient | null = null;

let isSocketRedisConfigured = false;

export const configureSocketIo = async (
    io: Server
): Promise<void> => {
    if (isSocketRedisConfigured) {
        console.warn(
            `[Socket.IO] Redis Adapter ya estaba configurado PID ${process.pid}`
        );

        return;
    }

    const pubClient = createClient({
        url: config.REDIS_URL,

        socket: {
            connectTimeout: 10_000,

            reconnectStrategy: (retries) => {
                return Math.min(
                    retries * 100,
                    3_000
                );
            },
        },
    });

    const subClient = pubClient.duplicate();

    pubClient.on("connect", () => {
        console.log(
            `[Socket Redis Pub] conectado PID ${process.pid}`
        );
    });

    pubClient.on("ready", () => {
        console.log(
            `[Socket Redis Pub] listo PID ${process.pid}`
        );
    });

    pubClient.on("reconnecting", () => {
        console.warn(
            `[Socket Redis Pub] reconectando PID ${process.pid}`
        );
    });

    pubClient.on("error", (error) => {
        console.error(
            `[Socket Redis Pub] error PID ${process.pid}`,
            error
        );
    });

    pubClient.on("end", () => {
        console.warn(
            `[Socket Redis Pub] conexión cerrada PID ${process.pid}`
        );
    });

    subClient.on("connect", () => {
        console.log(
            `[Socket Redis Sub] conectado PID ${process.pid}`
        );
    });

    subClient.on("ready", () => {
        console.log(
            `[Socket Redis Sub] listo PID ${process.pid}`
        );
    });

    subClient.on("reconnecting", () => {
        console.warn(
            `[Socket Redis Sub] reconectando PID ${process.pid}`
        );
    });

    subClient.on("error", (error) => {
        console.error(
            `[Socket Redis Sub] error PID ${process.pid}`,
            error
        );
    });

    subClient.on("end", () => {
        console.warn(
            `[Socket Redis Sub] conexión cerrada PID ${process.pid}`
        );
    });

    try {
        await Promise.all([
            pubClient.connect(),
            subClient.connect(),
        ]);

        io.adapter(
            createAdapter(
                pubClient,
                subClient,
                {
                    key: `taxi-hgo:${config.nodeEnv}:socket.io`,

                    publishOnSpecificResponseChannel: true,

                    requestsTimeout: 5_000,
                }
            )
        );

        socketPubClient = pubClient;
        socketSubClient = subClient;

        isSocketRedisConfigured = true;

        console.log(
            `[Socket.IO] Redis Adapter activo PID ${process.pid}`
        );
    } catch (error) {
        console.error(
            `[Socket.IO] No se pudo iniciar Redis Adapter PID ${process.pid}`,
            error
        );

        await Promise.allSettled([
            closeRedisClient(pubClient),
            closeRedisClient(subClient),
        ]);

        throw error;
    }
};

async function closeRedisClient(
    client: SocketRedisClient
): Promise<void> {
    if (!client.isOpen) {
        return;
    }

    await client.close();
}

export const closeSocketRedisAdapter =
    async (): Promise<void> => {
        const clients: SocketRedisClient[] = [];

        if (socketSubClient) {
            clients.push(socketSubClient);
        }

        if (socketPubClient) {
            clients.push(socketPubClient);
        }

        const results = await Promise.allSettled(
            clients.map((client) => {
                return closeRedisClient(client);
            })
        );

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(
                    `[Socket.IO] Error cerrando cliente Redis ${index}`,
                    result.reason
                );
            }
        });

        socketPubClient = null;
        socketSubClient = null;

        isSocketRedisConfigured = false;

        console.log(
            `[Socket.IO] Redis Adapter cerrado PID ${process.pid}`
        );
    };
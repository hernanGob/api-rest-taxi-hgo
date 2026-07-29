import http from "node:http";

import { createApp } from "./app.js";
import { config } from "./config/config.js";
import { initializeSocket } from "./socket/index.js";
import { connectRedis } from "./shared/redis/redis.client.js";
import { configureGracefulShutdown } from "./shared/shutdown/gracefulShutdown.js";

const main = async (): Promise<void> => {
    try {
        /*
         * Cliente Redis general utilizado para:
         * GET, SET, GEOADD, sesiones, caché, etc.
         */
        await connectRedis();

        const app = createApp();

        const httpServer = http.createServer(app);

        /*
         * Configura Socket.IO y su adapter Redis.
         */
        const io = await initializeSocket(
            httpServer,
        );

        /*
         * Registrar SIGINT y SIGTERM una sola vez
         * en este proceso.
         */
        configureGracefulShutdown(
            httpServer,
            io,
        );

        /*
         * Los errores emitidos después de listen()
         * no son capturados automáticamente por
         * el try/catch exterior.
         */
        httpServer.on("error", (error) => {
            console.error(
                `[HTTP] error del servidor. PID: ${process.pid}`,
                error,
            );
        });

        httpServer.listen(
            config.port,
            () => {
                console.log(
                    `Servidor corriendo en el puerto: ${config.port}`,
                );

                console.log(
                    `PID: ${process.pid}`,
                );
            },
        );
    } catch (error) {
        console.error(
            "Error al iniciar el servidor:",
            error,
        );

        process.exit(1);
    }
};

void main();
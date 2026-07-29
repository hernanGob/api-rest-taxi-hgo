import type { Server as HttpServer } from "node:http";
import type { Server as SocketServer } from "socket.io";

import { disconnectRedis } from "../redis/redis.client.js";
import { closeSocketRedisAdapter } from "../redis/socketRedisAdapter.js";

let isShuttingDown = false;

const FORCE_SHUTDOWN_TIMEOUT_MS = 10_000;

export function configureGracefulShutdown(
    httpServer: HttpServer,
    io: SocketServer,
): void {
    const shutdown = async (
        signal: "SIGINT" | "SIGTERM",
    ): Promise<void> => {
        if (isShuttingDown) {
            return;
        }

        isShuttingDown = true;

        console.log(
            `\n[Shutdown] señal ${signal} recibida. PID: ${process.pid}`,
        );

        /*
         * Impide que el proceso permanezca abierto para siempre
         * si algún socket o conexión no logra cerrarse.
         */
        const forceShutdownTimer = setTimeout(() => {
            console.error(
                `[Shutdown] tiempo de cierre excedido. Forzando salida. PID: ${process.pid}`,
            );

            process.exit(1);
        }, FORCE_SHUTDOWN_TIMEOUT_MS);

        /*
         * El temporizador no debe mantener vivo el proceso
         * si todo lo demás ya se cerró.
         */
        forceShutdownTimer.unref();

        try {
            /*
             * 1. Cerrar Socket.IO primero.
             *
             * Esto desconecta los clientes WebSocket y evita
             * que mantengan abierto el servidor HTTP.
             */
            await new Promise<void>((resolve) => {
                io.close(() => {
                    console.log(
                        `[Shutdown] Socket.IO cerrado. PID: ${process.pid}`,
                    );

                    resolve();
                });
            });

            /*
             * 2. Cerrar las conexiones Redis utilizadas
             * por el adapter de Socket.IO.
             */
            await closeSocketRedisAdapter();

            console.log(
                `[Shutdown] Redis Adapter cerrado. PID: ${process.pid}`,
            );

            /*
             * 3. Dejar de aceptar conexiones HTTP nuevas
             * y esperar a que terminen las actuales.
             */
            if (httpServer.listening) {
                await new Promise<void>((resolve, reject) => {
                    httpServer.close((error) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        console.log(
                            `[Shutdown] servidor HTTP cerrado. PID: ${process.pid}`,
                        );

                        resolve();
                    });
                });
            }

            /*
             * Para Node moderno, ayuda a eliminar conexiones
             * HTTP keep-alive que todavía continúen abiertas.
             */
            httpServer.closeIdleConnections?.();

            /*
             * 4. Cerrar Redis general:
             * GET, SET, GEOADD, sesiones, caché, etc.
             */
            await disconnectRedis();

            console.log(
                `[Shutdown] Redis general cerrado. PID: ${process.pid}`,
            );

            /*
             * 5. Cerrar PostgreSQL.
             *
             * Agrega aquí la función correspondiente:
             *
             * await closeDatabase();
             */

            clearTimeout(forceShutdownTimer);

            console.log(
                `[Shutdown] proceso cerrado correctamente. PID: ${process.pid}`,
            );

            process.exit(0);
        } catch (error) {
            clearTimeout(forceShutdownTimer);

            console.error(
                `[Shutdown] error cerrando el proceso. PID: ${process.pid}`,
                error,
            );

            process.exit(1);
        }
    };

    process.once("SIGINT", () => {
        void shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
        void shutdown("SIGTERM");
    });
}
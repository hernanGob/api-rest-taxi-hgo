import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.middleware.js";
import { type AuthenticatedSocket, type LocationPayload } from "./socket.types.js";
import { joinUserRooms, socketRooms } from "./socket.rooms.js";
import { setSocketServer } from "./socket.service.js";
import { config } from "../config/config.js";
import { configureSocketIo } from "../shared/redis/socketRedisAdapter.js";
import { getRedis, setRedis } from "../shared/redis/redis.services.js";
import { saveOperatorLocation } from "../modules/location/location.redis.js";

const CLIENT_URL = process.env.CLIENT_URL;

export async function initializeSocket(server: HttpServer) {
    const io = new Server(server, {
        path: config.nodeEnv === 'production' ? "/taxi-hgo/socket.io" : "/socket.io",
        cors: {
            origin: CLIENT_URL,
            credentials: true,
        },

        transports: [
            "polling",
            "websocket"
        ],
    });

    /**
     * Redis Adapter para PM2 Cluster
     */
    await configureSocketIo(io);

    setSocketServer(io);

    io.use(socketAuthMiddleware);

    io.on("connection", (socket: AuthenticatedSocket) => {
        const user = socket.user;

        if (!user) {
            socket.disconnect();
            return;
        }

        joinUserRooms(socket);

        console.log(
            `[Socket] connected ${user.type || user.rol}`,
            socket.id,
            "PID:",
            process.pid
        );


        socket.emit("connected", {
            message: "Socket connected successfully",
            user,
        });

        /* 
            SOPORTE
        */
        socket.on("join-support", () => {
            if (user.rol !== "admin" && user.rol !== "super_admin") {
                socket.emit("socket-error", {
                    message: "No autorizado para entrar a soporte",
                });

                return;
            }

            const room = socketRooms.conversationsSupport();

            socket.join(room);

            socket.emit("joined-support", {
                room,
            });
        });

        /*
            CHAT
        */
        socket.on("join-chat", (chatId: string | number) => {
            const room = socketRooms.chat(chatId);

            socket.join(room);

            socket.emit("joined-chat", {
                chatId,
                room,
            });
        });

        /*
            VIAJES DISPONIBLES
        */
        socket.on("join-available-trips", () => {

            if (user.type !== "driver") {
                socket.emit("socket-error", {
                    message: "No autorizado para ver viajes disponibles",
                });
                return;
            }

            const room = socketRooms.availableTrips();
            socket.join(room);

            socket.emit("joined-available-trips", {
                rooms: [
                    room
                ],
            });
        });

        socket.on("leave-available-trips", () => {
            const room = socketRooms.availableTrips();
            socket.leave(room);

            socket.emit("left-available-trips", {
                rooms: [
                    room
                ],
            });
        });

        /*
            ENTRAR AL VIAJE
        */
        socket.on('join-trip', async (tripId: string) => {
            if (!tripId) {
                socket.emit("socket-error", {
                    message: "ID de viaje inválido",
                });
            }

            const room = socketRooms.trip(tripId);
            socket.join(room);

            /* Recuperar la ultima ubicación del operador */
            const operatorLocation = await getRedis<LocationPayload>(
                `trip:${tripId}:operator-location`
            );

            if (operatorLocation) {
                socket.emit("operator-location", operatorLocation);
            }

            /* Recuperar ubicación del pasajero */
            const passengerLocation = await getRedis<LocationPayload>(
                `trip:${tripId}:passenger-location`
            );

            if (passengerLocation) {
                socket.emit("passenger-location", passengerLocation);
            }

            socket.emit("joined-trip", {
                tripId,
                room,
            });
        });

        socket.on("leave-trip", (tripId: string) => {
            const room = socketRooms.trip(tripId);

            socket.leave(room);

            socket.emit("left-trip", {
                tripId,
                room,
            });
        });

        /* Ubicación del pasajero */
        socket.on("passenger-location", async (payload) => {
            const tripId = String(payload?.tripId ?? "");

            const latitude = Number(payload?.location?.latitude);
            const longitude = Number(payload?.location?.longitude);

            if (!tripId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                socket.emit("socket-error", {
                    message: "Ubicación de pasajero inválida",
                });
                return;
            }

            const data: LocationPayload = {
                tripId,
                passengerId: user.sub,
                location: {
                    latitude,
                    longitude,
                },
                updatedAt: new Date().toISOString(),
            };

            await setRedis(
                `trip:${tripId}:passenger-location`,
                data,
                120
            );

            io.to(
                socketRooms.trip(tripId)
            ).emit(
                "passenger-location",
                data
            );
        });

        /* Ubicación del operador */
        /* socket.on("operator-location", async (payload) => {
            if (user.type !== "driver" || !user.idoperador) return;

            

            const tripId = String(payload?.tripId ?? "");

            const latitude = Number(payload?.location?.latitude);
            const longitude = Number(payload?.location?.longitude);

            if (!tripId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return;
            }

            const data: LocationPayload = {
                tripId,
                operatorId: user.idoperador,
                location: {
                    latitude,
                    longitude,
                },
                updatedAt: new Date().toISOString()
            };

            // Guardar ultima ubicación
            await setRedis(
                `trip:${tripId}:operator-location`,
                data,
                120,
            );

            await saveOperatorLocation({
                operatorId: user.idoperador,
                latitude,
                longitude
            });

            io.to(socketRooms.trip(tripId)).emit("operator-location", data);
        }); */
        socket.on("operator-location", async (payload) => {
            const operatorId = Number(user.idoperador);
            if (
                user.type !== "driver" ||
                !Number.isInteger(operatorId)
            ) {
                return;
            }

            const latitude = Number(
                payload?.location?.latitude
            );

            const longitude = Number(
                payload?.location?.longitude
            );

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {
                socket.emit("socket-error", {
                    message: "Ubicación de operador inválida",
                });

                return;
            }

            /*
             * Guardar siempre la ubicación general.
             * Esta ubicación se utiliza para buscar
             * operadores cercanos antes de aceptar un viaje.
             */
            await saveOperatorLocation({
                operatorId,
                latitude,
                longitude,
            });

            /*
             * Si todavía no tiene viaje, terminamos aquí.
             * Su ubicación general ya quedó almacenada.
             */
            const tripId = payload?.tripId
                ? String(payload.tripId)
                : null;

            if (!tripId) {
                socket.emit(
                    "operator-location-saved",
                    {
                        operatorId,
                        latitude,
                        longitude,
                    }
                );

                return;
            }

            /*
             * Si ya tiene viaje, también guardar
             * la ubicación específica del viaje.
             */
            const data: LocationPayload = {
                tripId,
                operatorId,
                location: {
                    latitude,
                    longitude,
                },
                updatedAt: new Date().toISOString(),
            };

            await setRedis(
                `trip:${tripId}:operator-location`,
                data,
                120
            );

            io.to(
                socketRooms.trip(tripId)
            ).emit(
                "operator-location",
                data
            );
        });



        socket.on(
            "disconnect",
            (reason) => {
                console.log(
                    "[Socket] disconnected",
                    socket.id,
                    reason
                );
            }
        );
    });

    return io;
}
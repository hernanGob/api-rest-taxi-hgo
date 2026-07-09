import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.middleware.js";
import { type AuthenticatedSocket } from "./socket.types.js";
import { joinUserRooms, socketRooms } from "./socket.rooms.js";
import { setSocketServer } from "./socket.service.js";
import { Socket } from "dgram";

const CLIENT_URL = process.env.CLIENT_URL;

const latestOperatorLocationsByTrip = new Map<
    string,
    {
        tripId: string;
        operatorId?: number;
        location: {
            latitude: number;
            longitude: number;
        },
        updatedAt: string;
    }
>();

export function initializeSocket(server: HttpServer) {
    const io = new Server(server, {
        path: "/socket.io",
        cors: {
            origin: CLIENT_URL,
            credentials: true,
        },
    });

    setSocketServer(io);

    io.use(socketAuthMiddleware);

    io.on("connection", (socket: AuthenticatedSocket) => {
        const user = socket.user;

        if (!user) {
            socket.disconnect();
            return;
        }

        joinUserRooms(socket);

        console.log(`Socket connected ${user.type || user.rol}:`, socket.id);
        //console.log("Socket rooms:", Array.from(socket.rooms));
        //console.log("JWT payload:", user);

        socket.emit("connected", {
            message: "Socket connected successfully",
            user,
        });

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

        socket.on("join-chat", (chatId: string | number) => {
            const room = socketRooms.chat(chatId);

            socket.join(room);

            socket.emit("joined-chat", {
                chatId,
                room,
            });
        });

        // ===== TRIPS =====
        socket.on("join-available-trips", () => {

            if (user.type !== "driver") {
                socket.emit("socket-error", {
                    message: "No autorizado para ver viajes disponibles",
                });
                return;
            }

            const roomsJoined: string[] = [];
            const globalRoom = socketRooms.availableTrips();
            socket.join(globalRoom);
            roomsJoined.push(globalRoom);

            socket.emit("joined-available-trips", {
                rooms: roomsJoined,
            });
        });

        socket.on("leave-available-trips", () => {
            const roomsLeft: string[] = [];

            const globalRoom = socketRooms.availableTrips();
            socket.leave(globalRoom);
            roomsLeft.push(globalRoom);

            socket.emit("left-available-trips", {
                rooms: roomsLeft,
            });
        });

        socket.on('join-trip', (tripId: string) => {
            if (!tripId) {
                socket.emit("socket-error", {
                    message: "ID de viaje inválido",
                });
            }

            const room = socketRooms.trip(tripId);
            socket.join(room);

            const latestLocation = latestOperatorLocationsByTrip.get(String(tripId));
            if(latestLocation) {
                socket.emit("operator-location", latestLocation);
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

        /* UBICACION DEL OPERADOR */
        socket.on("operator-location", (payload) => {
            if (user.type !== "driver") return;

            const tripId = String(payload?.tripId ?? "");

            const latitude = Number(payload?.location?.latitude);
            const longitude = Number(payload?.location?.longitude);

            if (!tripId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return;
            }

            io.to(socketRooms.trip(tripId)).emit("operator-location", {
                tripId,
                operatorId: user.idoperador,
                location: {
                    latitude,
                    longitude,
                },
                updatedAt: new Date().toISOString(),
            });
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected: ", socket.id);
        });
    });

    return io;
}
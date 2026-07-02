import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.middleware.js";
import { type AuthenticatedSocket } from "./socket.types.js";
import { joinUserRooms, socketRooms } from "./socket.rooms.js";
import { setSocketServer } from "./socket.service.js";
import { config } from "../config/config.js";

const CLIENT_URL = process.env.CLIENT_URL;

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
        console.log("Socket rooms:", Array.from(socket.rooms));
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

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
}
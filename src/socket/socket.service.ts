import { Server } from "socket.io";
import { socketRooms } from "./socket.rooms.js";
import { type TokenPayload } from "./socket.types.js";

let ioInstance: Server | null = null;

export function setSocketServer(io: Server) {
    ioInstance = io;
}

export function getSocketServer() {
    if (!ioInstance) {
        throw new Error("Socket server has not been initialized");
    }

    return ioInstance;
}

export function emitToUser<TPayload>(
    sub: string,
    event: string,
    payload: TPayload
) {
    getSocketServer().to(socketRooms.user(sub)).emit(event, payload);
}

export function emitToArea<TPayload>(
    areaId: number,
    event: string,
    payload: TPayload
) {
    getSocketServer().to(socketRooms.area(areaId)).emit(event, payload);
}

export function emitToOperator<TPayload>(
    idoperador: number,
    event: string,
    payload: TPayload
) {
    getSocketServer().to(socketRooms.operator(idoperador)).emit(event, payload);
}

export function emitToType<TPayload>(
    type: NonNullable<TokenPayload["type"]>,
    event: string,
    payload: TPayload
) {
    getSocketServer().to(socketRooms.type(type)).emit(event, payload);
}

export function emitToChat<TPayload>(
    chatId: string | number,
    event: string,
    payload: TPayload
) {
    getSocketServer().to(socketRooms.chat(chatId)).emit(event, payload);
}

export function emitToSupportRoom<TPayload>(
  event: string,
  payload: TPayload
) {
  getSocketServer()
    .to(socketRooms.conversationsSupport())
    .emit(event, payload);
}
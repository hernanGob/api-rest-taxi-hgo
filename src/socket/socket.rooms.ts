import { type AuthenticatedSocket, type TokenPayload } from "./socket.types.js";

export const socketRooms = {
    user: (sub: string) => `user:${sub}`,

    type: (type: NonNullable<TokenPayload["type"]>) => `type:${type}`,

    area: (areaId: number) => `area:${areaId}`,

    operator: (idoperador: number) => `operator:${idoperador}`,

    chat: (chatId: string | number) => `chat:${chatId}`,

    conversationsSupport: () => `conversations-support`,

    availableTrips: () => 'trips:available',

    trip: (tripId: string) => `trip:${tripId}`,
};

export function joinUserRooms(socket: AuthenticatedSocket) {
    const user = socket.user;

    if (!user) return;

    /* socket.join(socketRooms.user(user.sub)); */

    if (user.type) {
        socket.join(socketRooms.type(user.type));
    }

    if (typeof user.area_id === "number") {
        socket.join(socketRooms.area(user.area_id));
    }

    if (typeof user.idoperador === "number") {
        socket.join(socketRooms.operator(user.idoperador));
    }

    if (user.rol === 'super_admin' || user.rol === "admin") {
        socket.join(socketRooms.conversationsSupport());
    }

    if (user.type === "driver") {
        socket.join(socketRooms.availableTrips());
    }
}
import { Socket } from "socket.io";

export interface TokenPayload {
    sub: string;
    rol?: string | null;
    area_id?: number;
    type?: "super_admin" | "admin" | "driver" | "passenger";
    idoperador?: number;
}

export type AuthenticatedSocket = Socket & {
    user?: TokenPayload;
};

export type LocationPayload = {
    tripId: string;
    operatorId?: number | undefined;
    passengerId?: string | undefined;
    location: {
        latitude: number;
        longitude: number;
    };
    updatedAt: string;
};
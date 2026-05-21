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
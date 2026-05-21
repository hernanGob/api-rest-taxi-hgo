import { type Request, type Response, type NextFunction } from "express";
import type { SupportChatService } from "./supportChat.service.js";
import type {
    SupportConversationStatus,
    SupportSenderType,
} from "./supportChat.types.js";
import { emitToSupportRoom, emitToChat } from "../../socket/socket.service.js";

type AuthRequest = Request & {
    user?: {
        id?: string;
        sub?: string;
        role?: string;
        type?: string;
    };
};

export class SupportChatController {
    constructor(private readonly supportChatService: SupportChatService) { }

    async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const passengerId = req.user?.id ?? req.user?.sub ?? req.body.passengerId;
            console.log(passengerId);

            const result = await this.supportChatService.createConversation({
                passengerId,
                firstMessage: req.body.firstMessage,
            });

            emitToSupportRoom("support:conversation-created", result);

            if (result.id) {
                emitToChat(result.id, "support:message-created", req.body.firstMessage);
            }

            return res.status(201).json({
                status: "success",
                msg: "Conversación creada correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const senderId = req.user?.id ?? req.user?.sub ?? req.body.senderId;
            const { conversationId } = req.params;

            const senderType = (req.body.senderType ??
                req.user?.senderType ??
                "passenger") as SupportSenderType;

            if (!conversationId || typeof conversationId !== 'string') {
                return res.status(400).json({
                    ok: false,
                    status: "error",
                    msg: "conversationId es requerido y debe ser un texto válido"
                });
            }
            const result = await this.supportChatService.sendMessage({
                conversationId: conversationId,
                senderId,
                senderType,
                message: req.body.message,
            });

            emitToChat(conversationId, "support:message-created", result);

            emitToSupportRoom("support:conversation-updated", {
                conversationId,
                lastMessage: result.message,
                updatedAt: result.createdAt,
            });

            return res.status(201).json({
                status: "success",
                msg: "Mensaje enviado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const { conversationId } = req.params;

            if (!conversationId || typeof conversationId !== 'string') {
                return res.status(400).json({
                    ok: false,
                    status: "error",
                    msg: "conversationId es requerido y debe ser un texto válido"
                });
            }

            const result = await this.supportChatService.getMessages(
                conversationId
            );

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyConversations(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const passengerId = req.user?.id ?? req.user?.sub ?? req.query.passengerId;

            const result = await this.supportChatService.getPassengerConversations(
                String(passengerId)
            );

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllConversations(_req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.supportChatService.getAllConversations();

            return res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateConversationStatus(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { conversationId } = req.params;

            if (!conversationId || typeof conversationId !== 'string') {
                return res.status(400).json({
                    ok: false,
                    status: "error",
                    msg: "conversationId es requerido y debe ser un texto válido"
                });
            }

            const result = await this.supportChatService.updateConversationStatus(
                conversationId,
                req.body.status as SupportConversationStatus
            );

            return res.status(200).json({
                status: "success",
                msg: "Estatus actualizado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async markMessagesAsRead(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const readerType = (req.body.readerType ??
                req.user?.type ??
                "passenger") as SupportSenderType;

            const { conversationId } = req.params;

            if (!conversationId || typeof conversationId !== 'string') {
                return res.status(400).json({
                    ok: false,
                    status: "error",
                    msg: "conversationId es requerido y debe ser un texto válido"
                });
            }

            await this.supportChatService.markMessagesAsRead({
                conversationId: conversationId,
                readerType,
            });

            return res.status(200).json({
                status: "success",
                msg: "Mensajes marcados como leídos",
            });
        } catch (error) {
            next(error);
        }
    }

    async assignAdmin(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id ?? req.user?.sub ?? req.body.adminId;

            const { conversationId } = req.params;

            if (!conversationId || typeof conversationId !== 'string') {
                return res.status(400).json({
                    ok: false,
                    status: "error",
                    msg: "conversationId es requerido y debe ser un texto válido"
                });
            }

            const result = await this.supportChatService.assignAdmin(
                conversationId,
                String(adminId)
            );

            return res.status(200).json({
                status: "success",
                msg: "Administrador asignado correctamente",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
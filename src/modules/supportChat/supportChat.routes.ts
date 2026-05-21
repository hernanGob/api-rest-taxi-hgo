import { Router } from "express";
import type { SupportChatController } from "./supportChat.controller.js";
import { authenticatePassenger } from "../../middleware/passengerMiddleware.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";
import { authenticateSupportSender } from "../../middleware/authenticateSupportSender.js";
// import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";
// import { authenticatePassengerToken } from "../../middleware/authPassenger.js";

export const SupportChatRoutes = (
    supportChatController: SupportChatController
) => {
    const router = Router();

    // Crear conversación
    router.post(
        "/conversations",
        authenticatePassenger,
        supportChatController.createConversation.bind(supportChatController)
    );

    // Conversaciones del pasajero
    router.get(
        "/conversations",
        authenticatePassenger,
        supportChatController.getMyConversations.bind(supportChatController)
    );

    // Todas las conversaciones para admin
    router.get(
        "/admin/conversations",
        authenticateTokenWeb,
        supportChatController.getAllConversations.bind(supportChatController)
    );

    // Mensajes de una conversación
    router.get(
        "/conversations/:conversationId/messages",
        supportChatController.getMessages.bind(supportChatController)
    );

    // Enviar mensaje por REST
    router.post(
        "/conversations/:conversationId/messages",
        authenticateSupportSender,
        supportChatController.sendMessage.bind(supportChatController)
    );

    // Actualizar status open/closed
    router.patch(
        "/conversations/:conversationId/status",
        supportChatController.updateConversationStatus.bind(supportChatController)
    );

    // Marcar mensajes como leídos
    router.patch(
        "/conversations/:conversationId/read",
        supportChatController.markMessagesAsRead.bind(supportChatController)
    );

    //Asognar admin a conversación
    router.patch(
        "/conversations/:conversationId/assign-admin",
        supportChatController.assignAdmin.bind(supportChatController)
    );

    return router;
};
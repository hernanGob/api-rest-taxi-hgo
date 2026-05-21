import validator from "validator";
import { generateUUID } from "../../utils/uuid.js";
import type { SupportChatRepository } from "./supportChat.repo.js";
import type {
    CreateSupportConversationDto,
    SendSupportMessageDto,
    SupportConversationStatus,
    SupportSenderType,
} from "./supportChat.types.js";

export class SupportChatService {
    constructor(private readonly supportChatRepository: SupportChatRepository) { }

    async createConversation(data: CreateSupportConversationDto) {
        if (!data.passengerId || !validator.isUUID(data.passengerId)) {
            throw new Error("El passengerId no es válido");
        }

        const conversation = await this.supportChatRepository.createConversation({
            id: generateUUID(),
            passengerId: data.passengerId,
        });

        if (!conversation) {
            throw new Error("No se pudo crear la conversación");
        }

        if (data.firstMessage?.trim()) {
            await this.sendMessage({
                conversationId: conversation.id,
                senderId: data.passengerId,
                senderType: "passenger",
                message: data.firstMessage,
            });
        }

        return conversation;
    }

    async sendMessage(data: SendSupportMessageDto) {
        if (!validator.isUUID(data.conversationId)) {
            throw new Error("El conversationId no es válido");
        }

        if (!validator.isUUID(data.senderId)) {
            throw new Error("El senderId no es válido");
        }

        if (!["passenger", "admin"].includes(data.senderType)) {
            throw new Error("El senderType no es válido");
        }

        if (!data.message || validator.isEmpty(data.message.trim())) {
            throw new Error("El mensaje es requerido");
        }

        const conversation = await this.supportChatRepository.findConversationById(
            data.conversationId
        );

        if (!conversation) {
            throw new Error("Conversación no encontrada");
        }

        if (conversation.status === "closed") {
            throw new Error("La conversación está cerrada");
        }

        const message = await this.supportChatRepository.createMessage({
            id: generateUUID(),
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderType: data.senderType,
            message: data.message.trim(),
        });

        if (!message) {
            throw new Error("No se pudo enviar el mensaje");
        }

        return message;
    }

    async getMessages(conversationId: string) {
        if (!validator.isUUID(conversationId)) {
            throw new Error("El conversationId no es válido");
        }

        return this.supportChatRepository.findMessagesByConversationId(
            conversationId
        );
    }

    async getPassengerConversations(passengerId: string) {
        if (!validator.isUUID(passengerId)) {
            throw new Error("El passengerId no es válido");
        }

        return this.supportChatRepository.findPassengerConversations(passengerId);
    }

    async getAllConversations() {
        return this.supportChatRepository.findAllConversations();
    }

    async updateConversationStatus(
        conversationId: string,
        status: SupportConversationStatus
    ) {
        if (!validator.isUUID(conversationId)) {
            throw new Error("El conversationId no es válido");
        }

        if (!["open", "closed"].includes(status)) {
            throw new Error("El status no es válido");
        }

        const conversation =
            await this.supportChatRepository.updateConversationStatus(
                conversationId,
                status
            );

        if (!conversation) {
            throw new Error("Conversación no encontrada");
        }

        return conversation;
    }

    async markMessagesAsRead(params: {
        conversationId: string;
        readerType: SupportSenderType;
    }) {
        if (!validator.isUUID(params.conversationId)) {
            throw new Error("El conversationId no es válido");
        }

        await this.supportChatRepository.markMessagesAsRead(params);

        return true;
    }

    async assignAdmin(conversationId: string, adminId: string) {
        if (!validator.isUUID(conversationId)) {
            throw new Error("El conversationId no es válido");
        }

        if (!validator.isUUID(adminId)) {
            throw new Error("El adminId no es válido");
        }

        const conversation = await this.supportChatRepository.assignAdmin(
            conversationId,
            adminId
        );

        if (!conversation) {
            throw new Error("Conversación no encontrada");
        }

        return conversation;
    }
}
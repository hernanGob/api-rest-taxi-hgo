export type SupportConversationStatus = "open" | "closed";
export type SupportSenderType = "passenger" | "admin";

export interface SupportConversation {
    id: string;
    passengerId: string;
    assignedAdminId: string | null;
    status: SupportConversationStatus;
    updatedAt: string;
    closedAt: string | null;
    createdAt: string;
}

export interface SupportMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderType: SupportSenderType;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface CreateSupportConversationDto {
    passengerId: string;
    firstMessage?: string;
}

export interface SendSupportMessageDto {
    conversationId: string;
    senderId: string;
    senderType: SupportSenderType;
    message: string;
}

export interface UpdateSupportConversationStatusDto {
    status: SupportConversationStatus;
}

export interface ISupportChatRepository {
    createConversation(data: {
        id: string;
        passengerId: string;
    }): Promise<SupportConversation | null>;

    findConversationById(id: string): Promise<SupportConversation | null>;

    findPassengerConversations(passengerId: string): Promise<SupportConversation[]>;

    findAllConversations(): Promise<SupportConversation[]>;

    updateConversationStatus(
        id: string,
        status: SupportConversationStatus
    ): Promise<SupportConversation | null>;

    createMessage(data: {
        id: string;
        conversationId: string;
        senderId: string;
        senderType: SupportSenderType;
        message: string;
    }): Promise<SupportMessage | null>;

    findMessagesByConversationId(conversationId: string): Promise<SupportMessage[]>;

    markMessagesAsRead(params: {
        conversationId: string;
        readerType: SupportSenderType;
    }): Promise<void>;

    assignAdmin(
        conversationId: string,
        adminId: string
    ): Promise<SupportConversation | null>;
}
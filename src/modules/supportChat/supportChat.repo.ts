import type { Pool } from "pg";
import type {
    Conversation,
    ISupportChatRepository,
    SupportConversation,
    SupportConversationStatus,
    SupportMessage,
    SupportSenderType,
} from "./supportChat.types.js";

interface SupportConversationRow {
    id: string;
    passenger_id: string;
    assigned_admin_id: string | null;
    status: SupportConversationStatus;
    updated_at: string;
    closed_at: string | null;
    created_at: string;
}

interface SupportMessageRow {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: SupportSenderType;
    message: string;
    is_read: boolean;
    created_at: string;
}

const mapConversation = (row: SupportConversationRow): SupportConversation => ({
    id: row.id,
    passengerId: row.passenger_id,
    assignedAdminId: row.assigned_admin_id,
    status: row.status,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
});

const mapMessage = (row: SupportMessageRow): SupportMessage => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderType: row.sender_type,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
});

export class SupportChatRepository implements ISupportChatRepository {
    constructor(private readonly db: Pool) { }

    async createConversation(data: {
        id: string;
        passengerId: string;
    }): Promise<SupportConversation | null> {
        const result = await this.db.query<SupportConversationRow>(
            `
      INSERT INTO public.support_conversations
        (id, passenger_id, status, created_at, updated_at)
      VALUES
        ($1, $2, 'open', now(), now())
      RETURNING
        id,
        passenger_id,
        assigned_admin_id,
        status,
        updated_at,
        closed_at,
        created_at;
      `,
            [data.id, data.passengerId]
        );

        const row = result.rows[0];

        return row ? mapConversation(row) : null;
    }

    async findConversationById(id: string): Promise<SupportConversation | null> {
        const result = await this.db.query<SupportConversationRow>(
            `
      SELECT
        id,
        passenger_id,
        assigned_admin_id,
        status,
        updated_at,
        closed_at,
        created_at
      FROM public.support_conversations
      WHERE id = $1
      LIMIT 1;
      `,
            [id]
        );

        const row = result.rows[0];

        return row ? mapConversation(row) : null;
    }

    async findPassengerConversations(
        passengerId: string
    ): Promise<SupportConversation[]> {
        const result = await this.db.query<SupportConversationRow>(
            `
      SELECT
        id,
        passenger_id,
        assigned_admin_id,
        status,
        updated_at,
        closed_at,
        created_at
      FROM public.support_conversations
      WHERE passenger_id = $1
      ORDER BY updated_at DESC;
      `,
            [passengerId]
        );

        return result.rows.map(mapConversation);
    }

    async findAllConversations(): Promise<Conversation[]> {
        const result = await this.db.query(
            `
            select
                sc.id as "id",
                concat(p."name",' ', p.paternal_surname, ' ', p.maternal_surname) as "passenger_name",
                sc.status as "status",
                sc.updated_at as "updated_at",
                sc.closed_at as "closed_at",
                sc.created_at as "created_at"
            from
                public.support_conversations sc
            join public.passenger p on p.id = sc.passenger_id
            order by
                updated_at desc;`
        );

        return result.rows.map((item, _index) => {
            return {
                id: item.id,
                passengerName: item.passenger_name,
                status: item.status,
                createdAt: item.created_at,
                closedAt: item.closed_at,
                updatedAt: item.updated_at,
            }
        })
    }

    async updateConversationStatus(
        id: string,
        status: SupportConversationStatus
    ): Promise<SupportConversation | null> {
        const result = await this.db.query<SupportConversationRow>(
            `
      UPDATE public.support_conversations
      SET
        status = $2,
        closed_at = CASE WHEN $2 = 'closed' THEN now() ELSE null END,
        updated_at = now()
      WHERE id = $1
      RETURNING
        id,
        passenger_id,
        assigned_admin_id,
        status,
        updated_at,
        closed_at,
        created_at;
      `,
            [id, status]
        );

        const row = result.rows[0];

        return row ? mapConversation(row) : null;
    }

    async createMessage(data: {
        id: string;
        conversationId: string;
        senderId: string;
        senderType: SupportSenderType;
        message: string;
    }): Promise<SupportMessage | null> {
        const client = await this.db.connect();

        try {
            await client.query("BEGIN");

            const messageResult = await client.query<SupportMessageRow>(
                `
        INSERT INTO public.support_messages
          (id, conversation_id, sender_id, sender_type, message, is_read, created_at)
        VALUES
          ($1, $2, $3, $4, $5, false, now())
        RETURNING
          id,
          conversation_id,
          sender_id,
          sender_type,
          message,
          is_read,
          created_at;
        `,
                [
                    data.id,
                    data.conversationId,
                    data.senderId,
                    data.senderType,
                    data.message,
                ]
            );

            await client.query(
                `
        UPDATE public.support_conversations
        SET updated_at = now()
        WHERE id = $1;
        `,
                [data.conversationId]
            );

            await client.query("COMMIT");

            const row = messageResult.rows[0];

            return row ? mapMessage(row) : null;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async findMessagesByConversationId(
        conversationId: string
    ): Promise<SupportMessage[]> {
        const result = await this.db.query<SupportMessageRow>(
            `
      SELECT
        id,
        conversation_id,
        sender_id,
        sender_type,
        message,
        is_read,
        created_at
      FROM public.support_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
      `,
            [conversationId]
        );

        return result.rows.map(mapMessage);
    }

    async markMessagesAsRead(params: {
        conversationId: string;
        readerType: SupportSenderType;
    }): Promise<void> {
        await this.db.query(
            `
      UPDATE public.support_messages
      SET is_read = true
      WHERE conversation_id = $1
        AND sender_type <> $2;
      `,
            [params.conversationId, params.readerType]
        );
    }

    async assignAdmin(conversationId: string, adminId: string) {
        const result = await this.db.query<SupportConversationRow>(
            `
            UPDATE public.support_conversations
            SET assigned_admin_id = $2,
                updated_at = now()
            WHERE id = $1
            RETURNING
            id,
            passenger_id,
            assigned_admin_id,
            status,
            updated_at,
            closed_at,
            created_at;
        `,
            [conversationId, adminId]
        );

        const row = result.rows[0];

        return row ? mapConversation(row) : null;
    }
}
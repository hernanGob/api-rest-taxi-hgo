import {
    pgTable,
    pgEnum,
    uuid,
    text,
    varchar,
    integer,
    timestamp,
    jsonb,
    index,
    uniqueIndex,
    boolean,
    numeric,
    serial,
    date,
} from "drizzle-orm/pg-core";

export const supportConversationStatusEnum = pgEnum(
    "support_conversation_status",
    ["open", "closed"]
);

export const supportMessageSenderTypeEnum = pgEnum(
    "support_message_sender_type",
    ["passenger", "admin"]
);

/* ===================== PRICING SCOPE ENUM ===================== */
/* export const pricingScope = pgEnum("pricing_scope", ["GLOBAL", "ZONE", "MUNICIPALITY"]); */

/* ===================== ZONES ===================== */
export const zones = pgTable(
    "zones",
    {
        id: uuid("id").primaryKey().notNull(),
        name: varchar("name", { length: 80 }).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("zones_name_uq").on(t.name),
        index("zones_active_idx").on(t.isActive),
    ],
);

/* ===================== MUNICIPALITY ===================== */
export const municipality = pgTable(
    "municipality",
    {
        id: uuid("id").primaryKey().notNull(),
        name: text("name").notNull(),
        number: integer("number").notNull(),

        zoneId: uuid("zone_id").references(() => zones.id, { onDelete: "set null" }),

        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("municipality_name_uq").on(t.name),
        uniqueIndex("municipality_number_uq").on(t.number),
        index("municipality_zone_id_idx").on(t.zoneId),
        index("municipality_active_idx").on(t.isActive),
    ],
);

/* ===================== PRICING CONFIG ===================== */
export const pricingConfig = pgTable(
    "pricing_config",
    {
        id: uuid("id").primaryKey().notNull(),

        scope: text("scope").notNull(), // GLOBAL | ZONE | MUNICIPALITY

        // solo se usan dependiendo del scope (pueden ir null)
        zoneId: uuid("zone_id").references(() => zones.id, { onDelete: "cascade" }),
        municipalityId: uuid("municipality_id").references(() => municipality.id, { onDelete: "cascade" }),

        baseFare: numeric("base_fare", { precision: 10, scale: 2 }).notNull(),
        perMinute: numeric("per_minute", { precision: 10, scale: 2 }).notNull(),
        perKm: numeric("per_km", { precision: 10, scale: 2 }).notNull(),

        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("pricing_scope_idx").on(t.scope),
        index("pricing_zone_id_idx").on(t.zoneId),
        index("pricing_municipality_id_idx").on(t.municipalityId),
        index("pricing_active_idx").on(t.isActive),
    ],
);

/* ===================== EMERGENCY CONTACT ===================== */
export const emergencyContact = pgTable(
    "emergency_contact",
    {
        id: uuid("id").primaryKey().notNull(),
        name: text("name").notNull(),
        paternalSurname: text("paternal_surname").notNull(),
        maternalSurname: text("maternal_surname").notNull(),
        phone: varchar("phone", { length: 10 }).notNull(),
        email: text("email").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index("emergency_contact_phone_idx").on(t.phone)],
);

/* ===================== PASSENGER ===================== */
export const passenger = pgTable(
    "passenger",
    {
        id: uuid("id").primaryKey().notNull(),

        name: text("name").notNull(),
        paternalSurname: text("paternal_surname").notNull(),
        maternalSurname: text("maternal_surname").notNull(),

        phone: varchar("phone", { length: 15 }).notNull(),
        email: text("email").notNull().unique(),

        password: text("password").notNull(),

        emergencyContactId: uuid("emergency_contact_id").references(() => emergencyContact.id, {
            onDelete: "set null",
        }),

        dateOfBirth: timestamp("date_of_birth", { withTimezone: false }).notNull(),

        /* emailVerified: boolean("email_verified").default(false).notNull(),
        codeHash: text("code_hash").default("").notNull(),
        nonce: text("nonce").default("").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: false }), */

        isDeleted: boolean("is_deleted").default(false).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("passenger_email_uq").on(t.email),
        index("passenger_phone_idx").on(t.phone),
        index("passenger_emergency_contact_idx").on(t.emergencyContactId),
        index("passenger_deleted_idx").on(t.isDeleted),
    ],
);

/* ===================== USER ROLES ===================== */
export const userRole = pgTable(
    "user_role",
    {
        id: uuid("id").primaryKey().notNull(),
        role: text("role").notNull(),
        code: text("code").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [uniqueIndex("user_role_role_uq").on(t.role)],
);
/* ===================== ADMIN ===================== */
export const user = pgTable(
    "user",
    {
        id: uuid("id").primaryKey().notNull(),

        name: text("name").notNull(),
        paternalSurname: text("paternal_surname").notNull(),
        maternalSurname: text("maternal_surname").notNull(),

        phone: varchar("phone", { length: 15 }).notNull(),
        email: text("email").notNull(),

        passwordHash: text("password_hash"),

        /* emailVerified: boolean("email_verified").default(false).notNull(),
        codeHash: text("code_hash").default("").notNull(),
        nonce: text("nonce").default("").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: false }),

        isDeleted: boolean("is_deleted").default(false).notNull(), */

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

        userRoleId: uuid("user_role_id").references(() => userRole.id, {
            onDelete: "set null",
        }),
    },
    (t) => [
        uniqueIndex("user_email_uq").on(t.email),
        index("user_phone_idx").on(t.phone),
        /* index("user_deleted_idx").on(t.isDeleted), */
    ],
);

/* ===================== SERVICE TYPE ===================== */
export const serviceType = pgTable(
    "service_type",
    {
        id: serial("id").primaryKey().notNull(),
        name: varchar("name", { length: 50 }).notNull(),
        increasePercentage: numeric("increase_percentage", { precision: 5, scale: 2 }).notNull(),
    },
    (t) => [uniqueIndex("service_type_name_uq").on(t.name)],
);

/* ===================== TRIP STATUS ===================== */
export const tripStatus = pgTable(
    "trip_status",
    {
        id: serial("id").primaryKey().notNull(),
        status: text("status").notNull(),
    },
    (t) => [uniqueIndex("trip_status_status_uq").on(t.status)],
);

/* ===================== TRIPS ===================== */
type RoutePoint = {
    latitude: number;
    longitude: number;
};

export const trips = pgTable(
    "trips",
    {
        id: uuid("id").primaryKey().notNull(),

        passengerId: uuid("passenger_id")
            .notNull()
            .references(() => passenger.id, { onDelete: "cascade" }),

        idOperador: integer('idoperador'),

        origin: jsonb("origin").notNull(),
        destination: jsonb("destination").notNull(),

        destinationAddress: text("destination_address").notNull(),

        distanceKm: numeric("distance_km", { precision: 10, scale: 2 }).notNull(),
        fare: numeric("fare", { precision: 10, scale: 2 }).notNull(),
        routeToDestinationPath: jsonb('route_to_destination_path').$type<RoutePoint[]>(),

        tripStatusId: integer("trip_status_id")
            .notNull()
            .default(1)
            .references(() => tripStatus.id),

        serviceTypeId: integer("service_type_id")
            .notNull()
            .references(() => serviceType.id),

        // opcional: si decides tarifa por municipio/zona del ORIGEN o DESTINO
        // originMunicipalityId: uuid("origin_municipality_id").references(() => municipality.id, { onDelete: "set null" }),
        // destinationMunicipalityId: uuid("destination_municipality_id").references(() => municipality.id, { onDelete: "set null" }),

        requestedAt: timestamp("requested_at", { withTimezone: false }).defaultNow(),
        startedAt: timestamp("started_at", { withTimezone: false }),
        completedAt: timestamp("completed_at", { withTimezone: false }),

        durationMinutes: integer("duration_minutes").notNull().default(0),

        pricingConfigId: uuid("pricing_config_id").references(() => pricingConfig.id, {
            onDelete: "set null",
        }),

        passengerRating: integer("passenger_rating"),
        driverRating: integer("driver_rating"),

        passengerComment: text("passenger_comment"),
        driverComment: text("driver_comment"),

        pickupCode: varchar("pickup_code", { length: 5 }),
        acceptedAt: timestamp("accepted_at", { withTimezone: false }),
        cancelled_at: timestamp("cancelled_at", { withTimezone: false }),
    },
    (t) => [
        index("trips_passenger_id_idx").on(t.passengerId),
        index("trips_status_id_idx").on(t.tripStatusId),
        index("trips_service_type_id_idx").on(t.serviceTypeId),
        index("trips_pricing_config_id_idx").on(t.pricingConfigId),
    ],
);

/* ===================== DRIVERS ===================== */
export const drivers = pgTable(
    "drivers",
    {
        id: uuid("id").primaryKey().notNull(),
        idoperador: integer('id_operador').notNull().unique(),
        nombre: text('nombre').notNull(),
        apellidoPaterno: text('apellido_paterno').notNull(),
        apellidoMaterno: text('apellido_materno').notNull(),
        imagenPerfil: text('imagen_perfil').notNull(),
        password: text('password'),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        isSuspended: boolean('is_suspended').notNull().default(false),
    },
    (t) => [
    ],
);

/* ============== SUPPORT CHAT ============== */
export const supportConversations = pgTable("support_conversations", {
    id: uuid("id").primaryKey().notNull(),
    passengerId: uuid("passenger_id").notNull(),
    assignedAdminId: uuid("assigned_admin_id"),
    status: supportConversationStatusEnum("status").notNull().default("open"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const supportMessages = pgTable("support_messages", {
    id: uuid("id").defaultRandom().primaryKey(),

    conversationId: uuid("conversation_id")
        .notNull()
        .references(() => supportConversations.id, {
            onDelete: "cascade",
        }),

    senderId: uuid("sender_id").notNull(),

    senderType: supportMessageSenderTypeEnum("sender_type").notNull(),

    message: text("message").notNull(),

    isRead: boolean("is_read").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
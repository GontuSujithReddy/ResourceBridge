import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resourceBridgeOrganizations } from "./resourcebridge-organizations";

export const resourceBridgeResources = pgTable(
  "resourcebridge_resources",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    organizationId: integer("organization_id").references(() => resourceBridgeOrganizations.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    photoPaths: text("photo_paths").array().notNull().default(sql`ARRAY[]::text[]`),
    organizationName: text("organization_name").notNull(),
    organizationType: text("organization_type").notNull(),
    location: text("location").notNull(),
    capacity: integer("capacity"),
    visibility: text("visibility").notNull().default("public"),
    status: text("status").notNull().default("active"),
    requiresTraining: boolean("requires_training").notNull().default(false),
    supervised: boolean("supervised").notNull().default(false),
    priceLabel: text("price_label").notNull().default("Free"),
    timezone: text("timezone").notNull().default("UTC"),
    demoKey: text("demo_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("resourcebridge_resources_owner_idx").on(table.ownerId),
    index("resourcebridge_resources_public_idx").on(table.status, table.visibility, table.category),
    uniqueIndex("resourcebridge_resources_demo_key_idx").on(table.demoKey),
  ],
);

export const resourceBridgeBookings = pgTable(
  "resourcebridge_bookings",
  {
    id: serial("id").primaryKey(),
    resourceId: integer("resource_id").notNull().references(() => resourceBridgeResources.id),
    borrowerId: text("borrower_id").notNull(),
    ownerId: text("owner_id").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    purpose: text("purpose").notNull(),
    teamSize: integer("team_size").notNull().default(1),
    status: text("status").notNull().default("pending_approval"),
    ownerReason: text("owner_reason"),
    checkInCondition: text("check_in_condition"),
    checkInNotes: text("check_in_notes"),
    returnCondition: text("return_condition"),
    returnNotes: text("return_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("resourcebridge_bookings_borrower_idx").on(table.borrowerId, table.createdAt),
    index("resourcebridge_bookings_owner_idx").on(table.ownerId, table.createdAt),
    index("resourcebridge_bookings_resource_time_idx").on(table.resourceId, table.startAt, table.endAt),
  ],
);

export const resourceBridgeAuditEvents = pgTable(
  "resourcebridge_audit_events",
  {
    id: serial("id").primaryKey(),
    actorId: text("actor_id").notNull(),
    targetOwnerId: text("target_owner_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    entityName: text("entity_name").notNull(),
    action: text("action").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("resourcebridge_audit_owner_idx").on(table.targetOwnerId, table.createdAt),
    index("resourcebridge_audit_actor_idx").on(table.actorId, table.createdAt),
  ],
);

export const insertResourceBridgeResourceSchema = createInsertSchema(resourceBridgeResources).omit({
  id: true,
  createdAt: true,
});
export type ResourceBridgeResourceRow = typeof resourceBridgeResources.$inferSelect;
export type ResourceBridgeBookingRow = typeof resourceBridgeBookings.$inferSelect;
export type InsertResourceBridgeResource = z.infer<typeof insertResourceBridgeResourceSchema>;

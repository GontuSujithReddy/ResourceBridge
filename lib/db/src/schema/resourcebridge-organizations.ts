import { integer, pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const resourceBridgeOrganizations = pgTable(
  "resourcebridge_organizations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    verificationStatus: text("verification_status").notNull().default("pending"),
    verificationReviewedBy: text("verification_reviewed_by"),
    verificationReviewedAt: timestamp("verification_reviewed_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("resourcebridge_organizations_status_idx").on(table.verificationStatus, table.name),
    index("resourcebridge_organizations_creator_idx").on(table.createdBy, table.createdAt),
  ],
);

export const resourceBridgeOrganizationMemberships = pgTable(
  "resourcebridge_organization_memberships",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => resourceBridgeOrganizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("resourcebridge_membership_org_user_idx").on(table.organizationId, table.userId),
    index("resourcebridge_membership_user_status_idx").on(table.userId, table.status),
    index("resourcebridge_membership_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const insertResourceBridgeOrganizationSchema = createInsertSchema(resourceBridgeOrganizations).omit({
  id: true,
  verificationStatus: true,
  verificationReviewedBy: true,
  verificationReviewedAt: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});
export type ResourceBridgeOrganizationRow = typeof resourceBridgeOrganizations.$inferSelect;
export type ResourceBridgeOrganizationMembershipRow = typeof resourceBridgeOrganizationMemberships.$inferSelect;

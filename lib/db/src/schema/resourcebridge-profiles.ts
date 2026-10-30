import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const resourceBridgeProfiles = pgTable("resourcebridge_profiles", {
  userId: text("user_id").primaryKey(),
  accountType: text("account_type").notNull(),
  customerCareStatus: text("customer_care_status").notNull().default("not_requested"),
  displayName: text("display_name"),
  birthDate: date("birth_date", { mode: "string" }),
  cityRegion: text("city_region"),
  gender: text("gender"),
  detailsCompletedAt: timestamp("details_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResourceBridgeProfileSchema = createInsertSchema(resourceBridgeProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export type ResourceBridgeProfileRow = typeof resourceBridgeProfiles.$inferSelect;

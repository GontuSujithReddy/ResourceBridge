import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { resourceBridgeBookings } from "./resourcebridge";

export const resourceBridgeRatings = pgTable(
  "resourcebridge_ratings",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id").notNull().references(() => resourceBridgeBookings.id),
    raterId: text("rater_id").notNull(),
    targetId: text("target_id").notNull(),
    stars: integer("stars").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("resourcebridge_rating_booking_rater_idx").on(table.bookingId, table.raterId),
    index("resourcebridge_rating_target_created_idx").on(table.targetId, table.createdAt),
    check("resourcebridge_rating_stars_check", sql`${table.stars} between 1 and 5`),
  ],
);

export type ResourceBridgeRatingRow = typeof resourceBridgeRatings.$inferSelect;

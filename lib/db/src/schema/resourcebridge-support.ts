import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const resourceBridgeSupportTickets = pgTable("resourcebridge_support_tickets", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  assignedAgentId: text("assigned_agent_id"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("rb_support_requester_idx").on(table.requesterId)]);

export const resourceBridgeSupportMessages = pgTable("resourcebridge_support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => resourceBridgeSupportTickets.id),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("rb_support_message_ticket_idx").on(table.ticketId)]);

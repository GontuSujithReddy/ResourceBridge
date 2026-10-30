import { integer, index, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const resourceBridgePhotoUploads = pgTable(
  "resourcebridge_photo_uploads",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    objectPath: text("object_path").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("resourcebridge_photo_upload_object_path_idx").on(table.objectPath),
    index("resourcebridge_photo_upload_owner_created_idx").on(table.ownerId, table.createdAt),
  ],
);

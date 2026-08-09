import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminContent = pgTable("admin_content", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminContent = typeof adminContent.$inferSelect;

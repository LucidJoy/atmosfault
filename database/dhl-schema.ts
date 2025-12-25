import {
  text,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

/**
 * DHL Shipment Tracking Cache
 *
 * System Design Rationale:
 * - Cache DHL API responses to minimize external API calls
 * - Use TTL-based invalidation (updatedAt + cache duration)
 * - Store complete API response as JSONB for flexibility
 * - Index on trackingNumber for fast lookups
 */
export const dhl_shipments = pgTable(
  "dhl_shipments",
  {
    trackingNumber: varchar("tracking_number", { length: 100 }).notNull().primaryKey(),
    // Store complete DHL API response
    data: jsonb("data").notNull(),
    // Cache metadata
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Index on updatedAt for efficient cache cleanup queries
    updatedAtIdx: index("dhl_updated_at_idx").on(table.updatedAt),
  })
);

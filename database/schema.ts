import {
  decimal,
  integer,
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// store raw windborne API data
export const balloon_snapshots = pgTable(
  "balloons",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    latitude: decimal("latitiude").notNull(), // array[0]
    longitude: decimal("longitude").notNull(), // array[1]
    altitude: decimal("altitude").notNull(), // array[2], in km
    snapshotHour: integer("snapshot_hour").notNull(), // 0 - 23 (which JSON file)
    arrayIndex: integer("array_index").notNull(), // position in the API array
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique constraint: prevent duplicate snapshots for same hour/index
    hourIndexIdx: uniqueIndex("hour_index_idx").on(
      table.snapshotHour,
      table.arrayIndex
    ),
    // Index on fetchedAt for efficient cleanup queries
    fetchedAtIdx: index("fetched_at_idx").on(table.fetchedAt),
    // Index on snapshotHour for fast hour-based queries
    snapshotHourIdx: index("snapshot_hour_idx").on(table.snapshotHour),
  })
);

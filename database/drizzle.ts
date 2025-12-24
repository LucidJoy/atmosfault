import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(
  "postgresql://neondb_owner:npg_a3nuIzUj5NGS@ep-wandering-sunset-a4od2swh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
);

export const db = drizzle({ client: sql });

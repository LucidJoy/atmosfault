import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const dbUrl = process.env.DATABASE_URL;

const sql = neon(dbUrl as string);

export const db = drizzle({ client: sql });

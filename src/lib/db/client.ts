import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Single Prisma client per process. The driver adapter is the only
 * SQLite-specific line in the app: swapping to `@prisma/adapter-pg` or
 * `@prisma/adapter-libsql` (plus the datasource provider) is the whole
 * migration path to PostgreSQL or Turso.
 */
function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./data/portfolio.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { __prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = db;

export type DB = typeof db;

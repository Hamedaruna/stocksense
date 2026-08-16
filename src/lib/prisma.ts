import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter:
      process.env.NODE_ENV === "production"
        ? new PrismaLibSql({
            url: process.env.STOCKSENSE_TURSO_DATABASE_URL!,
            authToken: process.env.STOCKSENSE_TURSO_AUTH_TOKEN!,
          })
        : new PrismaBetterSqlite3({
            url: process.env.DATABASE_URL ?? "file:./dev.db",
          }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
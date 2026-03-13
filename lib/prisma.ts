import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida no ambiente.");
  }

  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Export named para compatibilidade com código que importa `prisma` diretamente
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrismaClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

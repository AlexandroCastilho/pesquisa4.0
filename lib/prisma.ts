import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizeDatabaseUrl(rawUrl: string): string {
  let normalized = rawUrl.trim();

  try {
    const parsed = new URL(normalized);
    const isSupabasePooler = parsed.hostname.endsWith("pooler.supabase.com");
    const isSessionPooler = parsed.port === "5432";

    // Em produção, evita Session mode no pooler da Supabase para reduzir estouro de conexões.
    if (process.env.NODE_ENV === "production" && isSupabasePooler && isSessionPooler) {
      parsed.port = "6543";

      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }

      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }

      normalized = parsed.toString();
      console.warn(
        "[prisma] DATABASE_URL ajustada para transaction pooler (6543) em produção para evitar MaxClientsInSessionMode."
      );
    }
  } catch {
    // Mantém URL original; erro de formato será reportado pelo driver ao conectar.
  }

  return normalized;
}

function buildPoolConfig(connectionString: string): ConstructorParameters<typeof PrismaPg>[0] {
  const envMax = Number.parseInt(process.env.PG_POOL_MAX ?? "", 10);
  const envIdle = Number.parseInt(process.env.PG_POOL_IDLE_MS ?? "", 10);
  const envConnectTimeout = Number.parseInt(process.env.PG_POOL_CONNECT_TIMEOUT_MS ?? "", 10);

  const max = Number.isFinite(envMax) && envMax > 0 ? envMax : process.env.NODE_ENV === "production" ? 1 : 5;
  const idleTimeoutMillis = Number.isFinite(envIdle) && envIdle >= 0 ? envIdle : 5_000;
  const connectionTimeoutMillis =
    Number.isFinite(envConnectTimeout) && envConnectTimeout > 0 ? envConnectTimeout : 10_000;

  return {
    connectionString,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida no ambiente.");
  }

  const connectionString = normalizeDatabaseUrl(url);
  const adapter = new PrismaPg(buildPoolConfig(connectionString), {
    onPoolError: (err) => {
      console.error("[prisma] erro de pool pg:", err.message);
    },
  });
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

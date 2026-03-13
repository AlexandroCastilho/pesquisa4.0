/**
 * Script temporário para executar as migrações SQL via query engine (pg direto).
 * Usa DATABASE_URL do .env.local quando NODE_ENV != production.
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { config } from "dotenv";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não encontrada.");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

const MIGRATIONS = [
  {
    name: "20260313120000_multi_tenant_empresa",
    file: "prisma/migrations/20260313120000_multi_tenant_empresa/migration.sql",
  },
  {
    name: "20260313143000_profile_roles_admin_access",
    file: "prisma/migrations/20260313143000_profile_roles_admin_access/migration.sql",
  },
];

async function createMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id VARCHAR(36) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    )
  `);
}

async function isMigrationApplied(name) {
  const result = await client.query(
    `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
    [name]
  );
  return result.rows.length > 0;
}

async function recordMigrationApplied(name) {
  const id = crypto.randomUUID();
  await client.query(
    `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
     VALUES ($1, $2, now(), $3, 1)
     ON CONFLICT (id) DO NOTHING`,
    [id, "manual", name]
  );
}

async function run() {
  await client.connect();
  console.log("✅ Conectado ao banco de dados.");

  await createMigrationsTable();

  for (const migration of MIGRATIONS) {
    const applied = await isMigrationApplied(migration.name);
    if (applied) {
      console.log(`⏭️  Migração já aplicada: ${migration.name}`);
      continue;
    }

    console.log(`▶️  Executando migração: ${migration.name}`);
    const sql = readFileSync(migration.file, "utf-8");

    try {
      await client.query(sql);
      await recordMigrationApplied(migration.name);
      console.log(`✅ Migração aplicada: ${migration.name}`);
    } catch (err) {
      console.error(`❌ Erro na migração ${migration.name}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("✅ Todas as migrações foram processadas.");
}

run().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});

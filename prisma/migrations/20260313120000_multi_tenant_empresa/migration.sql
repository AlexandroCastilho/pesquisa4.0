-- Multi-tenant migration: introduces empresas and links profiles/pesquisas to empresa_id

-- 1) Create empresas table
CREATE TABLE IF NOT EXISTS "empresas" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "slug" TEXT,
  "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "empresas_slug_key" ON "empresas"("slug");

-- 2) Add nullable empresa_id first (safe for existing rows)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "empresa_id" TEXT;
ALTER TABLE "pesquisas" ADD COLUMN IF NOT EXISTS "empresa_id" TEXT;

-- 3) Backfill companies from existing profile.company, grouping by normalized company name
WITH companies AS (
  SELECT
    lower(trim(company)) AS company_key,
    min(trim(company)) AS company_name
  FROM "profiles"
  WHERE company IS NOT NULL AND trim(company) <> ''
  GROUP BY lower(trim(company))
)
INSERT INTO "empresas" ("id", "nome", "slug", "criada_em", "atualizada_em")
SELECT
  'emp_' || substr(md5(company_key), 1, 24) AS id,
  company_name AS nome,
  regexp_replace(lower(company_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(company_key), 1, 8) AS slug,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM companies
ON CONFLICT ("id") DO NOTHING;

-- 4) Profiles with company -> link to shared empresa
UPDATE "profiles" p
SET "empresa_id" = 'emp_' || substr(md5(lower(trim(p.company))), 1, 24)
WHERE p."empresa_id" IS NULL
  AND p.company IS NOT NULL
  AND trim(p.company) <> '';

-- 5) Profiles without company -> personal empresa per profile
INSERT INTO "empresas" ("id", "nome", "slug", "criada_em", "atualizada_em")
SELECT
  'emp_' || substr(md5(p.id), 1, 24) AS id,
  COALESCE(NULLIF(trim(p.name), ''), 'Empresa') || ' (' || substr(p.id, 1, 6) || ')' AS nome,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "profiles" p
WHERE p."empresa_id" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "profiles" p
SET "empresa_id" = 'emp_' || substr(md5(p.id), 1, 24)
WHERE p."empresa_id" IS NULL;

-- 6) Backfill pesquisas.empresa_id from profile.empresa_id
UPDATE "pesquisas" pe
SET "empresa_id" = p."empresa_id"
FROM "profiles" p
WHERE pe."profile_id" = p."id"
  AND pe."empresa_id" IS NULL;

-- 7) Safety fallback for orphan pesquisas (if any) -> dedicated empresa
INSERT INTO "empresas" ("id", "nome", "slug", "criada_em", "atualizada_em")
SELECT
  'emp_' || substr(md5(pe."profile_id"), 1, 24) AS id,
  'Empresa (' || substr(pe."profile_id", 1, 6) || ')' AS nome,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "pesquisas" pe
WHERE pe."empresa_id" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "pesquisas" pe
SET "empresa_id" = 'emp_' || substr(md5(pe."profile_id"), 1, 24)
WHERE pe."empresa_id" IS NULL;

-- 8) Make columns required and add FKs/indexes
ALTER TABLE "profiles" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "pesquisas" ALTER COLUMN "empresa_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_empresa_id_fkey'
  ) THEN
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_empresa_id_fkey"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pesquisas_empresa_id_fkey'
  ) THEN
    ALTER TABLE "pesquisas"
      ADD CONSTRAINT "pesquisas_empresa_id_fkey"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "profiles_empresa_id_idx" ON "profiles"("empresa_id");
CREATE INDEX IF NOT EXISTS "pesquisas_empresa_id_idx" ON "pesquisas"("empresa_id");

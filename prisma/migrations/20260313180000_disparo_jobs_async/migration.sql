-- Async envio jobs: adiciona lote de disparo e status PROCESSANDO para envios

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'EnvioStatus' AND e.enumlabel = 'PROCESSANDO'
  ) THEN
    ALTER TYPE "EnvioStatus" ADD VALUE 'PROCESSANDO';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'DisparoJobStatus'
  ) THEN
    CREATE TYPE "DisparoJobStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "disparo_jobs" (
  "id" TEXT NOT NULL,
  "pesquisa_id" TEXT NOT NULL,
  "empresa_id" TEXT NOT NULL,
  "status" "DisparoJobStatus" NOT NULL DEFAULT 'PENDENTE',
  "total" INTEGER NOT NULL DEFAULT 0,
  "processados" INTEGER NOT NULL DEFAULT 0,
  "enviados" INTEGER NOT NULL DEFAULT 0,
  "erros" INTEGER NOT NULL DEFAULT 0,
  "iniciado_em" TIMESTAMP(3),
  "finalizado_em" TIMESTAMP(3),
  "lock_token" TEXT,
  "lock_at" TIMESTAMP(3),
  "ultimo_erro" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disparo_jobs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "envios" ADD COLUMN IF NOT EXISTS "job_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disparo_jobs_pesquisa_id_fkey'
  ) THEN
    ALTER TABLE "disparo_jobs"
      ADD CONSTRAINT "disparo_jobs_pesquisa_id_fkey"
      FOREIGN KEY ("pesquisa_id") REFERENCES "pesquisas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disparo_jobs_empresa_id_fkey'
  ) THEN
    ALTER TABLE "disparo_jobs"
      ADD CONSTRAINT "disparo_jobs_empresa_id_fkey"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'envios_job_id_fkey'
  ) THEN
    ALTER TABLE "envios"
      ADD CONSTRAINT "envios_job_id_fkey"
      FOREIGN KEY ("job_id") REFERENCES "disparo_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "disparo_jobs_empresa_id_pesquisa_id_status_idx"
  ON "disparo_jobs"("empresa_id", "pesquisa_id", "status");

CREATE INDEX IF NOT EXISTS "envios_job_id_idx" ON "envios"("job_id");

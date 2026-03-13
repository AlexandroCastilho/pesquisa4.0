-- Retry controls and observability for async envio processing

ALTER TABLE "envios"
  ADD COLUMN IF NOT EXISTS "tentativas" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ultima_tentativa_em" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proximo_retry_em" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "erro_codigo" TEXT;

CREATE INDEX IF NOT EXISTS "envios_job_id_status_proximo_retry_em_idx"
  ON "envios"("job_id", "status", "proximo_retry_em");

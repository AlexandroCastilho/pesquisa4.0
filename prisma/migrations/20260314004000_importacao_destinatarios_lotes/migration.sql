-- Histórico de lotes de importação de destinatários

CREATE TABLE IF NOT EXISTS "importacao_destinatarios_lotes" (
  "id" TEXT NOT NULL,
  "pesquisa_id" TEXT NOT NULL,
  "empresa_id" TEXT NOT NULL,
  "profile_id" TEXT,
  "formato" TEXT NOT NULL,
  "nome_arquivo" TEXT,
  "total_linhas" INTEGER NOT NULL,
  "validos" INTEGER NOT NULL,
  "invalidos" INTEGER NOT NULL,
  "duplicados" INTEGER NOT NULL,
  "rejeicoes" JSONB,
  "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "importacao_destinatarios_lotes_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'importacao_destinatarios_lotes_pesquisa_id_fkey'
  ) THEN
    ALTER TABLE "importacao_destinatarios_lotes"
      ADD CONSTRAINT "importacao_destinatarios_lotes_pesquisa_id_fkey"
      FOREIGN KEY ("pesquisa_id") REFERENCES "pesquisas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'importacao_destinatarios_lotes_empresa_id_fkey'
  ) THEN
    ALTER TABLE "importacao_destinatarios_lotes"
      ADD CONSTRAINT "importacao_destinatarios_lotes_empresa_id_fkey"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "importacao_destinatarios_lotes_pesquisa_id_criada_em_idx"
  ON "importacao_destinatarios_lotes"("pesquisa_id", "criada_em");

CREATE INDEX IF NOT EXISTS "importacao_destinatarios_lotes_empresa_id_criada_em_idx"
  ON "importacao_destinatarios_lotes"("empresa_id", "criada_em");

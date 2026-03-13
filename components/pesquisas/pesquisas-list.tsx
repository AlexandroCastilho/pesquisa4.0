"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeStatus } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PesquisaComContagem, PesquisaStatus } from "@/types/pesquisa";

type Props = {
  pesquisas: PesquisaComContagem[];
};

export function PesquisasList({ pesquisas }: Props) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"TODAS" | PesquisaStatus>("TODAS");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pesquisas.filter((p) => {
      const statusMatch = status === "TODAS" || p.status === status;
      const buscaMatch =
        termo.length === 0 ||
        p.titulo.toLowerCase().includes(termo) ||
        (p.descricao ?? "").toLowerCase().includes(termo);

      return statusMatch && buscaMatch;
    });
  }, [pesquisas, busca, status]);

  if (pesquisas.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          title="Nenhuma pesquisa criada ainda"
          description="Crie sua primeira pesquisa para iniciar os envios."
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="app-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            className="field-control"
            placeholder="Buscar por título ou descrição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select className="field-control md:w-56" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="TODAS">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ATIVA">Ativa</option>
            <option value="ENCERRADA">Encerrada</option>
          </select>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          title="Nenhum resultado para os filtros atuais"
          description="Tente limpar a busca ou alterar o status."
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map((p) => (
            <Link
              key={p.id}
              href={`/pesquisas/${p.id}`}
              className="app-card app-card-hover flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-semibold text-[var(--card-foreground)]">{p.titulo}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-1">
                  {p.descricao || "Sem descrição"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {p._count.perguntas} pergunta(s) · {p._count.envios} envio(s)
                </p>
              </div>
              <BadgeStatus status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

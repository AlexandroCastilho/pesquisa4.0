"use client";

import { useState, useMemo } from "react";

type Pergunta = { id: string; texto: string };
type ItemResposta = {
  id: string;
  perguntaId: string;
  textoLivre: string | null;
  valorEscala: number | null;
  pergunta: { texto: string; tipo: string };
  opcao: { texto: string } | null;
};
type Resposta = {
  id: string;
  envio: { nome: string; email: string; respondidoEm: Date | null };
  itens: ItemResposta[];
};

type Props = {
  pesquisaTitulo: string;
  perguntas: Pergunta[];
  respostas: Resposta[];
};

export function ResultadosClient({ pesquisaTitulo, perguntas, respostas }: Props) {
  const [filtroPerguntas, setFiltroPerguntas] = useState<string[]>([]);

  const respostasFiltradas = useMemo(() => {
    if (filtroPerguntas.length === 0) return respostas;
    return respostas.map((r) => ({
      ...r,
      itens: r.itens.filter((item) => filtroPerguntas.includes(item.perguntaId)),
    })).filter((r) => r.itens.length > 0);
  }, [respostas, filtroPerguntas]);

  function togglePergunta(id: string) {
    setFiltroPerguntas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function limparFiltros() {
    setFiltroPerguntas([]);
  }

  function exportarCSV() {
    const linhas: string[][] = [["Nome", "E-mail", "Respondido em", "Pergunta", "Resposta"]];

    for (const r of respostasFiltradas) {
      for (const item of r.itens) {
        const resposta =
          item.opcao?.texto ??
          item.textoLivre ??
          (item.valorEscala !== null ? String(item.valorEscala) : "");
        const respondidoEm = r.envio.respondidoEm
          ? new Date(r.envio.respondidoEm).toLocaleString("pt-BR")
          : "";
        linhas.push([
          escapeCsv(r.envio.nome),
          escapeCsv(r.envio.email),
          escapeCsv(respondidoEm),
          escapeCsv(item.pergunta.texto),
          escapeCsv(resposta),
        ]);
      }
    }

    const csvContent = linhas.map((l) => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resultados-${slugify(pesquisaTitulo)}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Filtros e ações */}
      <div className="app-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--card-foreground)]">Filtrar por pergunta</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {filtroPerguntas.length === 0
                ? "Todas as perguntas visíveis"
                : `${filtroPerguntas.length} pergunta(s) selecionada(s)`}
            </p>
          </div>
          <div className="flex gap-2">
            {filtroPerguntas.length > 0 && (
              <button type="button" onClick={limparFiltros} className="btn-ghost text-sm">
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={exportarCSV}
              disabled={respostasFiltradas.length === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {perguntas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {perguntas.map((p) => {
              const ativo = filtroPerguntas.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePergunta(p.id)}
                  className={
                    ativo
                      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] transition-colors"
                      : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
                  }
                >
                  {p.texto.length > 50 ? p.texto.slice(0, 50) + "…" : p.texto}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de respostas */}
      {respostasFiltradas.length === 0 ? (
        <div className="empty-state">
          <p className="text-[var(--foreground)] font-semibold">Nenhuma resposta encontrada</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {filtroPerguntas.length > 0
              ? "Tente remover ou alterar os filtros de pergunta."
              : "Aguardando respostas dos destinatários."}
          </p>
        </div>
      ) : (
        respostasFiltradas.map((r) => (
          <div key={r.id} className="app-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-[var(--card-foreground)]">{r.envio.nome}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{r.envio.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted-foreground)]">{r.itens.length} item(ns)</p>
                {r.envio.respondidoEm && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {new Date(r.envio.respondidoEm).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {r.itens.map((item) => (
                <div key={item.id} className="surface-soft p-3 text-sm">
                  <p className="font-medium text-[var(--foreground)]">{item.pergunta.texto}</p>
                  <p className="mt-0.5 text-[var(--muted-foreground)]">
                    {item.opcao?.texto ??
                      item.textoLivre ??
                      (item.valorEscala !== null ? `Nota: ${item.valorEscala}` : "—")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function escapeCsv(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

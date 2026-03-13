"use client";

import { useMemo, useState } from "react";
import type { Pergunta, Opcao } from "@/types/pergunta";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

type PerguntaComOpcoes = Pergunta & { opcoes: Opcao[] };

type Props = {
  pesquisaId: string;
  perguntas: PerguntaComOpcoes[];
};

type TipoPergunta = "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE" | "ESCALA";

function moveItem<T>(arr: T[], from: number, to: number) {
  const clone = [...arr];
  const [item] = clone.splice(from, 1);
  clone.splice(to, 0, item);
  return clone;
}

export function PerguntasManager({ pesquisaId, perguntas: initial }: Props) {
  const [perguntas, setPerguntas] = useState<PerguntaComOpcoes[]>(initial);
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<TipoPergunta>("MULTIPLA_ESCOLHA");
  const [opcoes, setOpcoes] = useState([{ texto: "" }, { texto: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");
  const [editTipo, setEditTipo] = useState<TipoPergunta>("MULTIPLA_ESCOLHA");
  const [editOpcoes, setEditOpcoes] = useState([{ texto: "" }, { texto: "" }]);

  const perguntasOrdenadas = useMemo(
    () => [...perguntas].sort((a, b) => a.ordem - b.ordem),
    [perguntas]
  );

  async function handleAddPergunta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      texto,
      tipo,
      ordem: perguntas.length,
      opcoes: tipo === "MULTIPLA_ESCOLHA" ? opcoes.filter((o) => o.texto.trim()) : undefined,
    };

    try {
      const res = await fetch(`/api/pesquisas/${pesquisaId}/perguntas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao criar pergunta.");
        return;
      }

      setPerguntas((prev) => [...prev, data.pergunta]);
      setTexto("");
      setOpcoes([{ texto: "" }, { texto: "" }]);
      setSuccess("Pergunta adicionada com sucesso.");
    } catch {
      setError("Não foi possível criar a pergunta.");
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicao(pergunta: PerguntaComOpcoes) {
    setEditingId(pergunta.id);
    setEditTexto(pergunta.texto);
    setEditTipo(pergunta.tipo as TipoPergunta);
    setEditOpcoes(
      pergunta.opcoes.length > 0
        ? pergunta.opcoes.map((o) => ({ texto: o.texto }))
        : [{ texto: "" }, { texto: "" }]
    );
  }

  async function salvarEdicao(perguntaId: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/pesquisas/${pesquisaId}/perguntas/${perguntaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: editTexto,
          tipo: editTipo,
          opcoes: editTipo === "MULTIPLA_ESCOLHA" ? editOpcoes.filter((o) => o.texto.trim()) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao editar pergunta.");
        return;
      }

      setPerguntas((prev) => prev.map((p) => (p.id === perguntaId ? data.pergunta : p)));
      setEditingId(null);
      setSuccess("Pergunta atualizada com sucesso.");
    } catch {
      setError("Não foi possível editar a pergunta.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirPergunta(perguntaId: string) {
    if (!confirm("Deseja realmente excluir esta pergunta? Esta ação não pode ser desfeita.")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/pesquisas/${pesquisaId}/perguntas/${perguntaId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao excluir pergunta.");
        return;
      }

      const next = perguntas.filter((p) => p.id !== perguntaId).map((p, idx) => ({ ...p, ordem: idx }));
      setPerguntas(next);
      setSuccess("Pergunta removida com sucesso.");
    } catch {
      setError("Não foi possível excluir a pergunta.");
    } finally {
      setLoading(false);
    }
  }

  async function reordenarPergunta(from: number, to: number) {
    if (to < 0 || to >= perguntasOrdenadas.length) return;

    const moved = moveItem(perguntasOrdenadas, from, to).map((p, idx) => ({ ...p, ordem: idx }));
    setPerguntas(moved);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/pesquisas/${pesquisaId}/perguntas/reordenar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: moved.map((p) => p.id) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao reordenar perguntas.");
        return;
      }

      setPerguntas(data.perguntas);
      setSuccess("Ordem das perguntas atualizada.");
    } catch {
      setError("Não foi possível reordenar perguntas.");
    }
  }

  return (
    <div className="space-y-6">
      {perguntasOrdenadas.length === 0 ? (
        <EmptyState
          title="Nenhuma pergunta cadastrada ainda"
          description="Adicione perguntas para começar a coletar respostas."
        />
      ) : (
        <div className="space-y-3">
          {perguntasOrdenadas.map((p, idx) => (
            <div key={p.id} className="app-card px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">
                    Pergunta {idx + 1} · {p.tipo.replace("_", " ")}
                  </p>
                  {editingId === p.id ? (
                    <div className="space-y-2">
                      <input className="field-control" value={editTexto} onChange={(e) => setEditTexto(e.target.value)} />
                      <select className="field-control" value={editTipo} onChange={(e) => setEditTipo(e.target.value as TipoPergunta)}>
                        <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                        <option value="TEXTO_LIVRE">Texto livre</option>
                        <option value="ESCALA">Escala (1–10)</option>
                      </select>
                      {editTipo === "MULTIPLA_ESCOLHA" && (
                        <div className="space-y-2">
                          {editOpcoes.map((o, i) => (
                            <input
                              key={i}
                              className="field-control"
                              value={o.texto}
                              placeholder={`Opção ${i + 1}`}
                              onChange={(e) => {
                                const next = [...editOpcoes];
                                next[i] = { texto: e.target.value };
                                setEditOpcoes(next);
                              }}
                            />
                          ))}
                          <button type="button" className="btn-ghost px-0" onClick={() => setEditOpcoes((prev) => [...prev, { texto: "" }])}>
                            + Adicionar opção
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-[var(--card-foreground)]">{p.texto}</p>
                      {p.opcoes.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {p.opcoes.map((o) => (
                            <li key={o.id} className="text-sm text-[var(--muted-foreground)]">• {o.texto}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button type="button" className="btn-secondary px-3" onClick={() => reordenarPergunta(idx, idx - 1)}>↑</button>
                  <button type="button" className="btn-secondary px-3" onClick={() => reordenarPergunta(idx, idx + 1)}>↓</button>
                  {editingId === p.id ? (
                    <>
                      <button type="button" className="btn-primary px-3" onClick={() => salvarEdicao(p.id)}>Salvar</button>
                      <button type="button" className="btn-ghost px-3" onClick={() => setEditingId(null)}>Cancelar</button>
                    </>
                  ) : (
                    <button type="button" className="btn-secondary px-3" onClick={() => iniciarEdicao(p)}>Editar</button>
                  )}
                  <button type="button" className="btn-danger px-3" onClick={() => excluirPergunta(p.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddPergunta} className="app-card p-6 space-y-5">
        <h2 className="font-semibold text-[var(--card-foreground)]">Adicionar pergunta</h2>

        <div>
          <label className="field-label">Texto da pergunta</label>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} required className="field-control" />
        </div>

        <div>
          <label className="field-label">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPergunta)} className="field-control">
            <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
            <option value="TEXTO_LIVRE">Texto livre</option>
            <option value="ESCALA">Escala (1–10)</option>
          </select>
        </div>

        {tipo === "MULTIPLA_ESCOLHA" && (
          <div className="space-y-2">
            <label className="field-label">Opções</label>
            {opcoes.map((o, i) => (
              <input
                key={i}
                value={o.texto}
                onChange={(e) => {
                  const next = [...opcoes];
                  next[i] = { texto: e.target.value };
                  setOpcoes(next);
                }}
                className="field-control"
                placeholder={`Opção ${i + 1}`}
              />
            ))}
            <button type="button" onClick={() => setOpcoes((prev) => [...prev, { texto: "" }])} className="btn-ghost px-0">
              + Adicionar opção
            </button>
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? "Salvando..." : "Adicionar pergunta"}
        </button>
      </form>
    </div>
  );
}

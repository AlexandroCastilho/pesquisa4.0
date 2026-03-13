"use client";

import { useState } from "react";
import type { Pergunta, Opcao } from "@/types/pergunta";

type PerguntaComOpcoes = Pergunta & { opcoes: Opcao[] };

type Props = {
  pesquisaId: string;
  perguntas: PerguntaComOpcoes[];
};

export function PerguntasManager({ pesquisaId, perguntas: initial }: Props) {
  const [perguntas, setPerguntas] = useState<PerguntaComOpcoes[]>(initial);
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<"MULTIPLA_ESCOLHA" | "TEXTO_LIVRE" | "ESCALA">("MULTIPLA_ESCOLHA");
  const [opcoes, setOpcoes] = useState([{ texto: "" }, { texto: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAddPergunta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

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
    } catch {
      setError("Não foi possível criar a pergunta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de perguntas existentes */}
      {perguntas.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma pergunta cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {perguntas.map((p, idx) => (
            <div key={p.id} className="app-card px-5 py-4">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Pergunta {idx + 1} · {p.tipo.replace("_", " ")}</p>
              <p className="font-medium text-[var(--card-foreground)]">{p.texto}</p>
              {p.opcoes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {p.opcoes.map((o) => (
                    <li key={o.id} className="text-sm text-[var(--muted-foreground)]">• {o.texto}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de nova pergunta */}
      <form onSubmit={handleAddPergunta} className="app-card p-6 space-y-5">
        <h2 className="font-semibold text-[var(--card-foreground)]">Adicionar pergunta</h2>

        <div>
          <label className="field-label">Texto da pergunta</label>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
            className="field-control"
          />
        </div>

        <div>
          <label className="field-label">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="field-control"
          >
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
            <button
              type="button"
              onClick={() => setOpcoes((prev) => [...prev, { texto: "" }])}
              className="btn-ghost px-0"
            >
              + Adicionar opção
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Adicionar pergunta"}
        </button>
      </form>
    </div>
  );
}

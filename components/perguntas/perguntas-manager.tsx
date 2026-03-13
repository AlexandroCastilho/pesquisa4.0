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
        <p className="text-slate-400 text-sm">Nenhuma pergunta cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {perguntas.map((p, idx) => (
            <div key={p.id} className="bg-white rounded-xl shadow px-5 py-4">
              <p className="text-xs text-slate-400 mb-1">Pergunta {idx + 1} · {p.tipo.replace("_", " ")}</p>
              <p className="font-medium text-slate-800">{p.texto}</p>
              {p.opcoes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {p.opcoes.map((o) => (
                    <li key={o.id} className="text-sm text-slate-500">• {o.texto}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de nova pergunta */}
      <form onSubmit={handleAddPergunta} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Adicionar pergunta</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700">Texto da pergunta</label>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          >
            <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
            <option value="TEXTO_LIVRE">Texto livre</option>
            <option value="ESCALA">Escala (1–10)</option>
          </select>
        </div>

        {tipo === "MULTIPLA_ESCOLHA" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Opções</label>
            {opcoes.map((o, i) => (
              <input
                key={i}
                value={o.texto}
                onChange={(e) => {
                  const next = [...opcoes];
                  next[i] = { texto: e.target.value };
                  setOpcoes(next);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder={`Opção ${i + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setOpcoes((prev) => [...prev, { texto: "" }])}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              + Adicionar opção
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-5 py-2 text-white font-medium hover:bg-slate-800 transition disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Adicionar pergunta"}
        </button>
      </form>
    </div>
  );
}

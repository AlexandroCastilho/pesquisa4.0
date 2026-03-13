"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Pergunta, Opcao } from "@/types/pergunta";

type PesquisaData = {
  id: string;
  titulo: string;
  descricao?: string | null;
  perguntas: Array<Pergunta & { opcoes: Opcao[] }>;
};

type EnvioData = {
  id: string;
  nome: string;
  email: string;
};

export default function ResponderPage() {
  const { token } = useParams<{ token: string }>();
  const [pesquisa, setPesquisa] = useState<PesquisaData | null>(null);
  const [envio, setEnvio] = useState<EnvioData | null>(null);
  const [respostas, setRespostas] = useState<
    Record<string, { opcaoId?: string; textoLivre?: string; valorEscala?: number }>
  >({});
  const [status, setStatus] = useState<"loading" | "ready" | "enviado" | "erro" | "expirado" | "respondido">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/respostas/${token}`)
      .then(async (res) => {
        if (res.status === 404) { setStatus("erro"); setErrorMsg("Link inválido."); return; }
        if (res.status === 409) { setStatus("respondido"); return; }
        if (res.status === 410) { setStatus("expirado"); return; }
        if (!res.ok) { setStatus("erro"); setErrorMsg("Erro ao carregar pesquisa."); return; }
        const data = await res.json();
        setPesquisa(data.pesquisa);
        setEnvio(data.envio);
        setStatus("ready");
      })
      .catch(() => { setStatus("erro"); setErrorMsg("Não foi possível carregar a pesquisa."); });
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const itens = Object.entries(respostas).map(([perguntaId, v]) => ({
      perguntaId,
      ...v,
    }));

    try {
      const res = await fetch(`/api/respostas/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message ?? "Erro ao enviar resposta.");
        return;
      }

      setStatus("enviado");
    } catch {
      setErrorMsg("Falha ao enviar resposta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <FullPage><p className="text-slate-500">Carregando pesquisa...</p></FullPage>;
  }

  if (status === "respondido") {
    return <FullPage><p className="text-green-600 font-medium">Esta pesquisa já foi respondida.</p></FullPage>;
  }

  if (status === "expirado") {
    return <FullPage><p className="text-amber-600 font-medium">Este link expirou.</p></FullPage>;
  }

  if (status === "enviado") {
    return (
      <FullPage>
        <p className="text-2xl font-bold text-slate-900">Obrigado!</p>
        <p className="mt-2 text-slate-600">Sua resposta foi registrada com sucesso.</p>
      </FullPage>
    );
  }

  if (status === "erro" || !pesquisa || !envio) {
    return <FullPage><p className="text-red-600">{errorMsg || "Erro desconhecido."}</p></FullPage>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-slate-900">{pesquisa.titulo}</h1>
          {pesquisa.descricao && (
            <p className="mt-2 text-slate-600">{pesquisa.descricao}</p>
          )}
          <p className="mt-1 text-sm text-slate-400">Olá, {envio.nome}!</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {pesquisa.perguntas.map((pergunta) => (
              <div key={pergunta.id}>
                <p className="font-medium text-slate-800">{pergunta.texto}</p>

                {pergunta.tipo === "MULTIPLA_ESCOLHA" && (
                  <div className="mt-3 space-y-2">
                    {pergunta.opcoes.map((opcao) => (
                      <label key={opcao.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={pergunta.id}
                          value={opcao.id}
                          onChange={() =>
                            setRespostas((prev) => ({
                              ...prev,
                              [pergunta.id]: { opcaoId: opcao.id },
                            }))
                          }
                          className="accent-slate-900"
                        />
                        <span className="text-slate-700">{opcao.texto}</span>
                      </label>
                    ))}
                  </div>
                )}

                {pergunta.tipo === "TEXTO_LIVRE" && (
                  <textarea
                    rows={3}
                    onChange={(e) =>
                      setRespostas((prev) => ({
                        ...prev,
                        [pergunta.id]: { textoLivre: e.target.value },
                      }))
                    }
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="Sua resposta..."
                  />
                )}

                {pergunta.tipo === "ESCALA" && (
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({
                            ...prev,
                            [pergunta.id]: { valorEscala: n },
                          }))
                        }
                        className={`w-9 h-9 rounded-lg border font-medium text-sm transition ${
                          respostas[pergunta.id]?.valorEscala === n
                            ? "bg-slate-900 text-white border-slate-900"
                            : "border-slate-300 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-white font-medium hover:bg-slate-800 transition disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Enviar respostas"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-8 text-center">
        {children}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Pergunta, Opcao } from "@/types/pergunta";
import { Alert } from "@/components/ui/alert";

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

  const totalPerguntas = pesquisa?.perguntas.length ?? 0;
  const totalRespondidas = Object.keys(respostas).length;
  const faltantes = Math.max(totalPerguntas - totalRespondidas, 0);

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
    setErrorMsg("");

    const itens = Object.entries(respostas).map(([perguntaId, v]) => ({
      perguntaId,
      ...v,
    }));

    if (pesquisa && itens.length !== pesquisa.perguntas.length) {
      setErrorMsg("Responda todas as perguntas antes de enviar.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/respostas/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.detail ?? data.message ?? "Erro ao enviar resposta.");
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
    return <FullPage><p className="text-[var(--muted-foreground)]">Carregando formulário da pesquisa...</p></FullPage>;
  }

  if (status === "respondido") {
    return <FullPage><Alert tone="success">Esta pesquisa já foi respondida com este link.</Alert></FullPage>;
  }

  if (status === "expirado") {
    return <FullPage><Alert tone="error">Este link expirou. Solicite um novo envio ao responsável pela pesquisa.</Alert></FullPage>;
  }

  if (status === "enviado") {
    return (
      <FullPage>
        <p className="text-2xl font-semibold text-[var(--foreground)]">Obrigado!</p>
        <p className="mt-2 text-[var(--muted-foreground)]">Sua resposta foi registrada com sucesso.</p>
      </FullPage>
    );
  }

  if (status === "erro" || !pesquisa || !envio) {
    return <FullPage><Alert tone="error">{errorMsg || "Não foi possível carregar esta pesquisa."}</Alert></FullPage>;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="app-card p-8">
          <h1 className="text-2xl font-semibold text-[var(--card-foreground)]">{pesquisa.titulo}</h1>
          {pesquisa.descricao && (
            <p className="mt-2 text-[var(--muted-foreground)]">{pesquisa.descricao}</p>
          )}
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Olá, {envio.nome}!</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Progresso: {totalRespondidas}/{totalPerguntas} resposta(s) preenchida(s)
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {pesquisa.perguntas.map((pergunta) => (
              <div key={pergunta.id}>
                <p className="font-medium text-[var(--foreground)]">{pergunta.texto}</p>

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
                        <span className="text-[var(--foreground)]">{opcao.texto}</span>
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
                    className="mt-3 field-control"
                    placeholder="Sua resposta..."
                  />
                )}

                {pergunta.tipo === "ESCALA" && (
                  <div className="mt-3 flex flex-wrap gap-2">
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
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

            {faltantes > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Faltam {faltantes} pergunta(s) para concluir o envio.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || faltantes > 0}
              className="btn-primary w-full disabled:opacity-60"
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
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8 text-center">
        {children}
      </div>
    </main>
  );
}

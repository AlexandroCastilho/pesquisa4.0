"use client";

import { useState, useEffect } from "react";
import { Alert } from "@/components/ui/alert";

type SmtpStatus = {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  userMask: string | null;
  from: string | null;
  missing: string[];
};

type TesteHistorico = {
  timestamp: string;
  ok: boolean;
  mensagem: string;
};

const HISTORICO_KEY = "smtp_test_history";
const MAX_HISTORICO = 10;

function carregarHistorico(): TesteHistorico[] {
  try {
    const raw = localStorage.getItem(HISTORICO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TesteHistorico[];
  } catch {
    return [];
  }
}

function salvarHistorico(historico: TesteHistorico[]) {
  try {
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico.slice(0, MAX_HISTORICO)));
  } catch {
    // localStorage indisponível (SSR guard)
  }
}

type Props = {
  initialStatus: SmtpStatus;
};

export function SmtpSettingsPanel({ initialStatus }: Props) {
  const [status, setStatus] = useState<SmtpStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [historico, setHistorico] = useState<TesteHistorico[]>([]);

  useEffect(() => {
    setHistorico(carregarHistorico());
  }, []);

  async function testarConexao() {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/company/smtp", { method: "POST" });
      const data = (await res.json()) as {
        test?: { ok: boolean; detail: string };
        status?: SmtpStatus;
        detail?: string;
        message?: string;
      };

      if (data.status) {
        setStatus(data.status);
      }

      const ok = res.ok && Boolean(data.test?.ok);
      const mensagem =
        data.test?.detail ?? data.detail ?? data.message ?? (ok ? "Conexão SMTP validada com sucesso." : "Falha ao testar conexão SMTP.");

      const novoRegistro: TesteHistorico = {
        timestamp: new Date().toISOString(),
        ok,
        mensagem,
      };

      const novoHistorico = [novoRegistro, ...carregarHistorico()].slice(0, MAX_HISTORICO);
      salvarHistorico(novoHistorico);
      setHistorico(novoHistorico);

      setFeedback({ tone: ok ? "success" : "error", text: mensagem });
    } catch {
      const mensagem = "Não foi possível validar SMTP no momento.";
      const novoRegistro: TesteHistorico = {
        timestamp: new Date().toISOString(),
        ok: false,
        mensagem,
      };
      const novoHistorico = [novoRegistro, ...carregarHistorico()].slice(0, MAX_HISTORICO);
      salvarHistorico(novoHistorico);
      setHistorico(novoHistorico);
      setFeedback({ tone: "error", text: mensagem });
    } finally {
      setLoading(false);
    }
  }

  const ultimoTeste = historico[0];

  return (
    <div className="space-y-5">
      <div className="app-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Configuração SMTP</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Diagnóstico em tempo real do ambiente do servidor para envios de e-mail.
            </p>
            {ultimoTeste && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Último teste:{" "}
                <span className={ultimoTeste.ok ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                  {ultimoTeste.ok ? "Sucesso" : "Falha"}
                </span>{" "}
                — {new Date(ultimoTeste.timestamp).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          <button type="button" className="btn-primary" disabled={loading} onClick={testarConexao}>
            {loading ? "Testando..." : "Testar conexão SMTP"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <InfoRow label="Status" value={status.configured ? "Configurado" : "Pendente"} />
          <InfoRow label="Host" value={status.host ?? "-"} />
          <InfoRow label="Porta" value={status.port !== null ? String(status.port) : "-"} />
          <InfoRow label="TLS/SSL" value={status.secure === null ? "-" : status.secure ? "Ativo" : "Inativo"} />
          <InfoRow label="Usuário" value={status.userMask ?? "-"} />
          <InfoRow label="From" value={status.from ?? "-"} />
        </div>

        {status.missing.length > 0 ? (
          <div className="mt-4 alert alert-error">
            Variáveis ausentes: <strong>{status.missing.join(", ")}</strong>
          </div>
        ) : null}

        {feedback ? (
          <div className="mt-4">
            <Alert tone={feedback.tone}>{feedback.text}</Alert>
          </div>
        ) : null}
      </div>

      {historico.length > 0 && (
        <div className="app-card p-6">
          <h3 className="text-base font-semibold text-[var(--card-foreground)]">Histórico de testes</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Últimos {historico.length} teste(s) realizados neste navegador.</p>
          <div className="mt-4 space-y-2">
            {historico.map((item, i) => (
              <div key={i} className="surface-soft p-3 flex items-start gap-3 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${item.ok ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <div className="min-w-0">
                  <p className="text-[var(--foreground)] truncate">{item.mensagem}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {new Date(item.timestamp).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
            onClick={() => {
              localStorage.removeItem(HISTORICO_KEY);
              setHistorico([]);
            }}
          >
            Limpar histórico
          </button>
        </div>
      )}

      <div className="app-card p-6">
        <h3 className="text-base font-semibold text-[var(--card-foreground)]">Checklist para produção</h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)] list-disc pl-5">
          <li>Validar SPF, DKIM e DMARC do domínio de envio.</li>
          <li>Garantir mailbox de resposta (reply-to) monitorada.</li>
          <li>Configurar limites de taxa no provedor SMTP.</li>
          <li>Registrar alertas para falhas de autenticação e timeout.</li>
        </ul>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-soft p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 font-medium text-[var(--foreground)] break-all">{value}</p>
    </div>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";
import type { Envio } from "@/types/envio";
import type { DisparoJob } from "@/types/disparo-job";
import { BadgeEnvioStatus } from "@/components/ui/badge";

type Props = {
  pesquisaId: string;
  enviosIniciais: Envio[];
};

type Destinatario = { nome: string; email: string };

type CriarLoteResponse = {
  lote?: {
    job: {
      id: string;
      status: "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";
      total: number;
      processados: number;
      enviados: number;
      erros: number;
      criadoEm: string | Date;
      iniciadoEm?: string | Date | null;
      finalizadoEm?: string | Date | null;
    };
    totalSolicitados: number;
    totalUnicos: number;
    totalIgnoradosDuplicados: number;
    totalPendentesCriados: number;
  };
  detail?: string;
  message?: string;
};

type ProgressoResponse = {
  progresso?: DisparoJob;
};

function toTimeValue(dateInput?: string | Date | null) {
  if (!dateInput) return 0;
  const time = new Date(dateInput).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortEnviosByRecent(items: Envio[]) {
  return [...items].sort((a, b) => {
    const aTime = toTimeValue(a.criadoEm) || toTimeValue(a.enviadoEm);
    const bTime = toTimeValue(b.criadoEm) || toTimeValue(b.enviadoEm);
    return bTime - aTime;
  });
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string, separator: "," | ";") {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === separator) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function parseCsvDestinatarios(csvRaw: string) {
  const lines = csvRaw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { destinatarios: [] as Destinatario[], ignoradas: 0, erro: "Arquivo CSV vazio." };
  }

  const separator: "," | ";" =
    lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";

  const headers = parseCsvLine(lines[0], separator).map(normalizeHeader);
  const nomeIndex = headers.findIndex((h) => h === "nome" || h === "cliente");
  const emailIndex = headers.findIndex((h) => h === "email");

  if (nomeIndex < 0 || emailIndex < 0) {
    return {
      destinatarios: [] as Destinatario[],
      ignoradas: Math.max(0, lines.length - 1),
      erro: "Cabeçalho inválido. Use nome,email (ou Nome,E-mail / cliente,email).",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenEmails = new Set<string>();
  const destinatarios: Destinatario[] = [];
  let ignoradas = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i], separator);
    const nome = (cols[nomeIndex] ?? "").trim();
    const emailOriginal = (cols[emailIndex] ?? "").trim().toLowerCase();

    if (!nome || !emailOriginal || !emailRegex.test(emailOriginal)) {
      ignoradas += 1;
      continue;
    }

    if (seenEmails.has(emailOriginal)) {
      ignoradas += 1;
      continue;
    }

    seenEmails.add(emailOriginal);
    destinatarios.push({ nome, email: emailOriginal });
  }

  return { destinatarios, ignoradas, erro: "" };
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";

  const day = String(dt.getUTCDate()).padStart(2, "0");
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const year = dt.getUTCFullYear();
  const hours = String(dt.getUTCHours()).padStart(2, "0");
  const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
  const seconds = String(dt.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export function EnviosPanel({ pesquisaId, enviosIniciais }: Props) {
  const [envios, setEnvios] = useState<Envio[]>(sortEnviosByRecent(enviosIniciais));
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([{ nome: "", email: "" }]);
  const [expiraDias, setExpiraDias] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [csvMsg, setCsvMsg] = useState("");
  const [jobAtivoId, setJobAtivoId] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<DisparoJob | null>(null);

  const totalEnviados = envios.length;
  const totalRespondidos = envios.filter((e) => e.status === "RESPONDIDO").length;
  const totalPendentes = envios.filter((e) => e.status === "PENDENTE" || e.status === "PROCESSANDO").length;
  const totalErro = envios.filter((e) => e.status === "ERRO").length;
  const taxaResposta = totalEnviados > 0 ? (totalRespondidos / totalEnviados) * 100 : 0;

  const recarregarEnvios = useCallback(async () => {
    const listRes = await fetch(`/api/pesquisas/${pesquisaId}/envios`);
    if (!listRes.ok) return;
    const listData = (await listRes.json()) as { envios?: Envio[] };
    setEnvios(sortEnviosByRecent(listData.envios ?? []));
  }, [pesquisaId]);

  useEffect(() => {
    let ativo = true;

    const carregarJobAtivo = async () => {
      try {
        const res = await fetch(`/api/pesquisas/${pesquisaId}/disparos/ativo`);
        if (!res.ok || !ativo) return;

        const data = (await res.json()) as { jobAtivo?: DisparoJob | null };
        if (data.jobAtivo?.id && ativo) {
          setProgresso(data.jobAtivo);
          if (data.jobAtivo.emAndamento) {
            setJobAtivoId(data.jobAtivo.id);
          }
        }
      } catch {
        // Falhas temporárias não devem bloquear o uso da tela.
      }
    };

    carregarJobAtivo();

    return () => {
      ativo = false;
    };
  }, [pesquisaId]);

  useEffect(() => {
    if (!jobAtivoId) return;

    let ativo = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/pesquisas/${pesquisaId}/disparos/${jobAtivoId}?processar=1&batchSize=10`
        );
        if (!res.ok) return;

        const data = (await res.json()) as ProgressoResponse;
        if (!data.progresso || !ativo) return;

        setProgresso(data.progresso);
        await recarregarEnvios();

        if (!data.progresso.emAndamento) {
          setJobAtivoId(null);
          setSuccessMsg(
            `Lote finalizado: ${data.progresso.enviados} enviado(s), ${data.progresso.erros} erro(s).`
          );
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        // Mantém polling na próxima janela sem travar UI.
      }
    };

    tick();
    intervalId = setInterval(tick, 2000);

    return () => {
      ativo = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobAtivoId, pesquisaId, recarregarEnvios]);

  async function handleImportCsv(file: File) {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Falha ao ler o arquivo CSV."));
      reader.readAsText(file, "utf-8");
    });

    const parsed = parseCsvDestinatarios(text);

    if (parsed.erro) {
      setError(parsed.erro);
      setCsvMsg("");
      return;
    }

    if (parsed.destinatarios.length === 0) {
      setError("Nenhuma linha válida encontrada no CSV.");
      setCsvMsg(`0 linha(s) importada(s). ${parsed.ignoradas} ignorada(s).`);
      return;
    }

    setError("");
    setDestinatarios(parsed.destinatarios);
    setCsvMsg(
      `${parsed.destinatarios.length} linha(s) válida(s) importada(s). ${parsed.ignoradas} ignorada(s).`
    );
  }

  function downloadCsvModel() {
    const content =
      "nome,email\nJoão Silva,joao@email.com\nMaria Souza,maria@email.com\n";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-clientes.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function addDestinatario() {
    setDestinatarios((prev) => [...prev, { nome: "", email: "" }]);
  }

  function removeDestinatario(index: number) {
    setDestinatarios((prev) => {
      if (prev.length <= 1) return [{ nome: "", email: "" }];
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleDisparar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const destsFiltrados = destinatarios.filter(
      (d) => d.nome.trim() && d.email.trim()
    );

    if (destsFiltrados.length === 0) {
      setError("Adicione ao menos um destinatário com nome e e-mail.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/pesquisas/${pesquisaId}/disparar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatarios: destsFiltrados, expiraDias }),
      });

      const data = (await res.json()) as CriarLoteResponse;
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao disparar pesquisa.");
        return;
      }

      if (!data.lote?.job?.id) {
        setError("Não foi possível iniciar o lote de disparo.");
        return;
      }

      setProgresso({
        id: data.lote.job.id,
        status: data.lote.job.status,
        total: data.lote.job.total,
        processados: data.lote.job.processados,
        enviados: data.lote.job.enviados,
        erros: data.lote.job.erros,
        pendentes: Math.max(0, data.lote.job.total - data.lote.job.processados),
        percentual:
          data.lote.job.total > 0
            ? Math.round((data.lote.job.processados / data.lote.job.total) * 100)
            : 100,
        emAndamento: data.lote.job.status === "PENDENTE" || data.lote.job.status === "PROCESSANDO",
        criadoEm: data.lote.job.criadoEm,
        iniciadoEm: data.lote.job.iniciadoEm,
        finalizadoEm: data.lote.job.finalizadoEm,
      });
      setJobAtivoId(data.lote.job.id);

      setSuccessMsg(
        `Lote iniciado com ${data.lote.totalPendentesCriados} envio(s) pendente(s). ` +
          `${data.lote.totalIgnoradosDuplicados} destinatário(s) ignorado(s) por já terem envio ativo.`
      );
      setDestinatarios([{ nome: "", email: "" }]);
      setCsvMsg("");

      await recarregarEnvios();
    } catch {
      setError("Não foi possível disparar a pesquisa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulário de disparo */}
      <form onSubmit={handleDisparar} className="app-card p-6 space-y-5">
        <h2 className="font-semibold text-[var(--card-foreground)]">Disparar para novos destinatários</h2>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 space-y-3">
          <p className="text-sm text-[var(--foreground)]">Formato esperado do CSV: nome,email</p>
          <p className="text-xs text-[var(--muted-foreground)]">João Silva,joao@email.com</p>
          <p className="text-xs text-[var(--muted-foreground)]">Maria Souza,maria@email.com</p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={loading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!file) return;
                try {
                  await handleImportCsv(file);
                } catch {
                  setError("Não foi possível ler o arquivo CSV.");
                }
              }}
              className="block w-full max-w-xs text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:brightness-95 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={downloadCsvModel}
              disabled={loading}
              className="btn-secondary disabled:opacity-60"
            >
              Baixar modelo CSV
            </button>
          </div>

          {csvMsg && <p className="text-sm text-[var(--success)]">{csvMsg}</p>}
        </div>

        <div className="space-y-2">
          {destinatarios.map((d, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-2">
              <input
                value={d.nome}
                disabled={loading}
                onChange={(e) => {
                  const next = [...destinatarios];
                  next[i] = { ...next[i], nome: e.target.value };
                  setDestinatarios(next);
                }}
                placeholder="Nome"
                className="field-control"
              />
              <input
                type="email"
                value={d.email}
                disabled={loading}
                onChange={(e) => {
                  const next = [...destinatarios];
                  next[i] = { ...next[i], email: e.target.value };
                  setDestinatarios(next);
                }}
                placeholder="E-mail"
                className="field-control"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => removeDestinatario(i)}
                className="btn-secondary px-3 disabled:opacity-60 md:self-auto self-end"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={addDestinatario}
            className="btn-ghost px-0"
          >
            + Adicionar destinatário
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--foreground)]">Expira em</label>
          <input
            type="number"
            min={1}
            max={365}
            value={expiraDias}
            disabled={loading}
            onChange={(e) => setExpiraDias(Number(e.target.value))}
            className="field-control w-20 px-2.5"
          />
          <span className="text-sm text-[var(--muted-foreground)]">dias</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMsg && <p className="text-sm text-[var(--success)]">{successMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Disparar pesquisa"}
        </button>
      </form>

      <section className="app-card p-6 space-y-4">
        <h3 className="font-semibold text-[var(--card-foreground)]">Histórico de envios</h3>

        {progresso && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Lote atual: {progresso.processados}/{progresso.total}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{progresso.percentual}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-white/80">
              <div
                className="h-2 rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${progresso.percentual}%` }}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Enviados: {progresso.enviados} · Erros: {progresso.erros} · Pendentes: {progresso.pendentes}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl bg-[var(--muted)] p-3">
            <p className="text-xs text-[var(--muted-foreground)]">Total enviados</p>
            <p className="text-xl font-semibold text-[var(--card-foreground)]">{totalEnviados}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Respondidos</p>
            <p className="text-xl font-semibold text-emerald-800">{totalRespondidos}</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-xs text-indigo-700">Pendentes</p>
            <p className="text-xl font-semibold text-indigo-800">{totalPendentes}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs text-rose-700">Com erro</p>
            <p className="text-xl font-semibold text-rose-800">{totalErro}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Taxa de resposta</p>
            <p className="text-xl font-semibold text-amber-800">
              {taxaResposta.toFixed(1).replace(".", ",")}%
            </p>
          </div>
        </div>

        {envios.length === 0 ? (
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum envio realizado ainda. Após o primeiro disparo, o histórico aparecerá aqui.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Enviado em</th>
                  <th className="px-4 py-3 text-left">Respondido em</th>
                  <th className="px-4 py-3 text-left">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {envios.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-[var(--card-foreground)] font-medium whitespace-nowrap">{e.nome}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{e.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BadgeEnvioStatus status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatDateTime(e.enviadoEm)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatDateTime(e.respondidoEm)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs">
                      <span className="block break-words" title={e.erroMsg ?? ""}>
                        {e.erroMsg ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

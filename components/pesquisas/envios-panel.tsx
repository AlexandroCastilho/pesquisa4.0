"use client";

import { useState } from "react";
import type { Envio } from "@/types/envio";
import { BadgeEnvioStatus } from "@/components/ui/badge";

type Props = {
  pesquisaId: string;
  enviosIniciais: Envio[];
};

type Destinatario = { nome: string; email: string };

export function EnviosPanel({ pesquisaId, enviosIniciais }: Props) {
  const [envios, setEnvios] = useState<Envio[]>(enviosIniciais);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([{ nome: "", email: "" }]);
  const [expiraDias, setExpiraDias] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao disparar pesquisa.");
        return;
      }

      const enviados = data.resultados.filter(
        (r: { status: string }) => r.status === "ENVIADO"
      ).length;
      setSuccessMsg(`${enviados} e-mail(s) enviado(s) com sucesso.`);
      setDestinatarios([{ nome: "", email: "" }]);

      // Recarrega a lista de envios
      const listRes = await fetch(`/api/pesquisas/${pesquisaId}`);
      if (listRes.ok) {
        const pesquisaData = await listRes.json();
        setEnvios(pesquisaData.pesquisa?.envios ?? envios);
      }
    } catch {
      setError("Não foi possível disparar a pesquisa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de envios */}
      {envios.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhum envio realizado ainda.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Enviado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {envios.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-slate-800 font-medium">{e.nome}</td>
                  <td className="px-4 py-3 text-slate-500">{e.email}</td>
                  <td className="px-4 py-3">
                    <BadgeEnvioStatus status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {e.enviadoEm
                      ? new Date(e.enviadoEm).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulário de disparo */}
      <form onSubmit={handleDisparar} className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Disparar para novos destinatários</h2>

        <div className="space-y-2">
          {destinatarios.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={d.nome}
                onChange={(e) => {
                  const next = [...destinatarios];
                  next[i] = { ...next[i], nome: e.target.value };
                  setDestinatarios(next);
                }}
                placeholder="Nome"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
              <input
                type="email"
                value={d.email}
                onChange={(e) => {
                  const next = [...destinatarios];
                  next[i] = { ...next[i], email: e.target.value };
                  setDestinatarios(next);
                }}
                placeholder="E-mail"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDestinatarios((prev) => [...prev, { nome: "", email: "" }])}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            + Adicionar destinatário
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Expira em</label>
          <input
            type="number"
            min={1}
            max={365}
            value={expiraDias}
            onChange={(e) => setExpiraDias(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
          <span className="text-sm text-slate-500">dias</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-5 py-2 text-white font-medium hover:bg-slate-800 transition disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Disparar pesquisa"}
        </button>
      </form>
    </div>
  );
}

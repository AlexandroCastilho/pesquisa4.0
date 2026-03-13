"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaPesquisaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pesquisas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descricao }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao criar pesquisa.");
        return;
      }

      router.push(`/pesquisas/${data.pesquisa.id}`);
    } catch {
      setError("Não foi possível criar a pesquisa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Nova pesquisa</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white rounded-xl shadow p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Título *</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            placeholder="Ex: Pesquisa de satisfação Q1 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            placeholder="Descrição opcional da pesquisa"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2 text-white font-medium hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar pesquisa"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

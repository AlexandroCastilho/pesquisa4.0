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
      <h1 className="page-title">Nova pesquisa</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 app-card p-6">
        <div>
          <label className="field-label">Título *</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="field-control"
            placeholder="Ex: Pesquisa de satisfação Q1 2026"
          />
        </div>

        <div>
          <label className="field-label">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="field-control"
            placeholder="Descrição opcional da pesquisa"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar pesquisa"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";

export default function NovaPesquisaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const tituloNormalizado = titulo.trim();
    const descricaoNormalizada = descricao.trim();

    if (!tituloNormalizado) {
      setError("Informe um título para a pesquisa.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/pesquisas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tituloNormalizado, descricao: descricaoNormalizada }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao criar pesquisa.");
        return;
      }

      setSuccess("Pesquisa criada com sucesso. Redirecionando...");
      router.push(`/pesquisas/${data.pesquisa.id}`);
    } catch {
      setError("Não foi possível criar a pesquisa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Nova pesquisa</h1>
        <p className="page-subtitle">Defina o tema da pesquisa. Você poderá configurar perguntas e envios na próxima etapa.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 app-card p-6" aria-busy={loading}>
        <div>
          <label className="field-label">Título *</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            disabled={loading}
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
            disabled={loading}
            className="field-control"
            placeholder="Descrição opcional da pesquisa"
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

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
            disabled={loading}
            onClick={() => router.back()}
            className="btn-secondary disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

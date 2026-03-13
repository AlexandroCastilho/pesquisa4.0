"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = (await response.json()) as { message?: string; detail?: string };

      if (!response.ok) {
        setError(data.detail ?? data.message ?? "Não foi possível redefinir a senha.");
        return;
      }

      setMessage(data.message ?? "Senha atualizada com sucesso.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.replace("/login"), 1500);
    } catch {
      setError("Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8">
        <h1 className="page-title">Definir nova senha</h1>
        <p className="page-subtitle">Digite e confirme sua nova senha para concluir a recuperação.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="field-label">Nova senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="field-control block min-h-11"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="field-label">Confirmar nova senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="field-control block min-h-11"
              placeholder="Repita a nova senha"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center">
          <Link href="/login" className="text-[var(--accent-foreground)] hover:underline">
            Voltar para login
          </Link>
        </div>
      </div>
    </main>
  );
}

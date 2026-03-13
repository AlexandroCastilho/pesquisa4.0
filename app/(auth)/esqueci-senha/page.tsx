"use client";

import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = (await response.json()) as { message?: string; detail?: string };

      if (!response.ok) {
        setError(data.detail ?? data.message ?? "Não foi possível enviar o e-mail de recuperação.");
        return;
      }

      setMessage(
        data.message ??
          "Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha."
      );
      setEmail("");
    } catch {
      setError("Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8">
        <h1 className="page-title">Recuperar senha</h1>
        <p className="page-subtitle">Informe seu e-mail para receber o link de redefinição.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="field-label">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              className="field-control block min-h-11"
              placeholder="email@empresa.com"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
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

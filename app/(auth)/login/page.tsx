"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const password = String(formData.get("password") ?? "");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? data.message ?? "Erro ao fazer login.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent)]" />
        <h1 className="page-title relative">Entrar</h1>
        <p className="page-subtitle relative">Acesse sua conta e continue acompanhando suas pesquisas.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="field-label">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              inputMode="email"
              className="field-control block min-h-11"
              placeholder="email@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field-control block min-h-11"
              placeholder="Sua senha"
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/cadastro" className="text-[var(--accent-foreground)] hover:underline">
            Criar conta
          </Link>
          <Link href="/esqueci-senha" className="text-[var(--accent-foreground)] hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </main>
  );
}

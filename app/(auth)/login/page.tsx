"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-600">Acesse sua conta</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              placeholder="email@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              placeholder="Sua senha"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/cadastro" className="text-slate-700 hover:underline">
            Criar conta
          </Link>
          <Link href="/esqueci-senha" className="text-slate-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </main>
  );
}

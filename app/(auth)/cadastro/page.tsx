"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = (await response.json()) as { message?: string; detail?: string };

      if (!response.ok) {
        setError(result.detail ?? result.message ?? "Não foi possível concluir o cadastro.");
        return;
      }

      setMessage(result.message ?? "Conta criada! Verifique seu e-mail para confirmar o acesso.");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8">
        <h1 className="page-title">Criar conta</h1>
        <p className="page-subtitle">Cadastre sua empresa</p>

        <form onSubmit={handleSignup} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="field-label">Nome</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="field-control block min-h-11"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label htmlFor="company" className="field-label">Empresa</label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              autoComplete="organization"
              className="field-control block min-h-11"
              placeholder="Nome da empresa"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="field-label">E-mail</label>
            <input
              id="signup-email"
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

          <div>
            <label htmlFor="signup-password" className="field-label">Senha</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="field-control block min-h-11"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center">
          <Link href="/login" className="text-[var(--accent-foreground)] hover:underline">
            Já tenho conta
          </Link>
        </div>
      </div>
    </main>
  );
}

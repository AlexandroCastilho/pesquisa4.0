"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim(), company: company.trim() },
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage("Conta criada! Verifique seu e-mail para confirmar o acesso.");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-600">Cadastre sua empresa</p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Empresa</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              placeholder="Nome da empresa"
            />
          </div>

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
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center">
          <Link href="/login" className="text-slate-700 hover:underline">
            Já tenho conta
          </Link>
        </div>
      </div>
    </main>
  );
}

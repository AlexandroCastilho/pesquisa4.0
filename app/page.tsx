import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900">Pesquisa 4.0</h1>
        <p className="mt-2 text-sm text-slate-600">
          Plataforma corporativa de pesquisas de satisfação.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 text-center text-white transition hover:bg-slate-800"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-slate-700 transition hover:bg-slate-50"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}

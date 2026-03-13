import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-xl app-card p-8">
        <h1 className="page-title">Pesquisa 4.0</h1>
        <p className="page-subtitle">
          Plataforma corporativa de pesquisas de satisfação.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="btn-primary"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="btn-secondary"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}

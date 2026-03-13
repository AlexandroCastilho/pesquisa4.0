import Link from "next/link";

export default function EsqueciSenhaPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md app-card p-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Recuperar senha</h1>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Funcionalidade em implementação. Entre em contato com o administrador
          para redefinir o acesso.
        </p>
        <Link
          href="/login"
          className="btn-primary mt-6"
        >
          Voltar para login
        </Link>
      </div>
    </main>
  );
}

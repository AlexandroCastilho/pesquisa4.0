import Link from "next/link";

export default function EsqueciSenhaPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
        <p className="mt-3 text-sm text-slate-600">
          Funcionalidade em implementação. Entre em contato com o administrador
          para redefinir o acesso.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
        >
          Voltar para login
        </Link>
      </div>
    </main>
  );
}

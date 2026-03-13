import Link from "next/link";
import { requireAuthTenantContext } from "@/lib/auth-context";
import { listarPesquisas } from "@/services/pesquisa.service";
import { BadgeStatus } from "@/components/ui/badge";

export default async function PesquisasPage() {
  const ctx = await requireAuthTenantContext();
  const pesquisas = await listarPesquisas(ctx.empresa.id);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Pesquisas</h1>
        <Link href="/pesquisas/nova" className="btn-primary">
          + Nova pesquisa
        </Link>
      </div>

      {pesquisas.length === 0 ? (
        <div className="mt-12 text-center text-[var(--muted-foreground)]">
          Nenhuma pesquisa criada ainda.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pesquisas.map((p) => (
            <Link
              key={p.id}
              href={`/pesquisas/${p.id}`}
              className="app-card app-card-hover flex items-center justify-between px-6 py-4"
            >
              <div>
                <p className="font-semibold text-[var(--card-foreground)]">{p.titulo}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {p._count.perguntas} pergunta(s) · {p._count.envios} envio(s)
                </p>
              </div>
              <BadgeStatus status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

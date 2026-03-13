import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { listarPesquisas } from "@/services/pesquisa.service";
import { PesquisasList } from "@/components/pesquisas/pesquisas-list";

export default async function PesquisasPage() {
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  const pesquisas = await listarPesquisas(ctx.empresa.id);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pesquisas</h1>
        <Link href="/pesquisas/nova" className="btn-primary">
          + Nova pesquisa
        </Link>
      </div>

      <PesquisasList pesquisas={pesquisas} />
    </div>
  );
}

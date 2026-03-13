import { notFound, redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { listarEnvios } from "@/services/envio.service";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { EnviosPanel } from "@/components/pesquisas/envios-panel";

type Props = { params: Promise<{ id: string }> };

export default async function EnviosPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
  if (!pesquisa) notFound();

  const envios = await listarEnvios(id, ctx.empresa.id);
  if (!envios) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="page-title">Envios</h1>
      <p className="page-subtitle">{pesquisa.titulo}</p>

      <div className="mt-6">
        <EnviosPanel pesquisaId={id} enviosIniciais={envios} />
      </div>
    </div>
  );
}

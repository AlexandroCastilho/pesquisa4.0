import { notFound } from "next/navigation";
import { requireAuthTenantContext } from "@/lib/auth-context";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { PerguntasManager } from "@/components/perguntas/perguntas-manager";

type Props = { params: Promise<{ id: string }> };

export default async function PerguntasPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireAuthTenantContext();

  const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
  if (!pesquisa) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="page-title">Perguntas</h1>
      <p className="page-subtitle">{pesquisa.titulo}</p>

      <div className="mt-6">
        <PerguntasManager pesquisaId={id} perguntas={pesquisa.perguntas} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { listarRespostasDaPesquisa } from "@/services/resposta.service";
import { ResultadosClient } from "@/components/pesquisas/resultados-client";

type Props = { params: Promise<{ id: string }> };

export default async function ResultadosPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
  if (!pesquisa) notFound();

  const respostas = await listarRespostasDaPesquisa(id, ctx.empresa.id);
  const totalEnvios = pesquisa._count.envios;
  const taxaResposta = totalEnvios > 0 ? Math.round((respostas.length / totalEnvios) * 100) : 0;

  const perguntas = pesquisa.perguntas.map((p: { id: string; texto: string }) => ({
    id: p.id,
    texto: p.texto,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resultados</h1>
          <p className="page-subtitle">{pesquisa.titulo}</p>
        </div>
        <Link href={`/pesquisas/${id}`} className="btn-secondary">Voltar para visão da pesquisa</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="app-card p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Respostas coletadas</p>
          <p className="text-3xl font-bold text-[var(--card-foreground)] mt-1">{respostas.length}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Total de envios</p>
          <p className="text-3xl font-bold text-[var(--card-foreground)] mt-1">{totalEnvios}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Taxa de resposta</p>
          <p className="text-3xl font-bold text-[var(--card-foreground)] mt-1">{taxaResposta}%</p>
        </div>
      </div>

      <ResultadosClient
        pesquisaTitulo={pesquisa.titulo}
        perguntas={perguntas}
        respostas={respostas}
      />
    </div>
  );
}

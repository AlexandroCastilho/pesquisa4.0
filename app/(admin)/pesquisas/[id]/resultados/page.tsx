import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { listarRespostasDaPesquisa } from "@/services/resposta.service";

type Props = { params: Promise<{ id: string }> };
type RespostasDaPesquisa = Awaited<ReturnType<typeof listarRespostasDaPesquisa>>;
type RespostaDaPesquisa = RespostasDaPesquisa[number];
type ItemDaResposta = RespostaDaPesquisa["itens"][number];

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

      {respostas.length === 0 ? (
        <div className="empty-state">
          <p className="text-[var(--foreground)] font-semibold">Nenhuma resposta recebida ainda</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Quando os destinatários responderem, você verá as análises aqui.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {respostas.map((r: RespostaDaPesquisa) => (
            <div key={r.id} className="app-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-[var(--card-foreground)]">{r.envio.nome}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{r.envio.email}</p>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">{r.itens.length} item(ns)</p>
              </div>
              <div className="space-y-3">
                {r.itens.map((item: ItemDaResposta) => (
                  <div key={item.id} className="surface-soft p-3 text-sm">
                    <p className="font-medium text-[var(--foreground)]">{item.pergunta.texto}</p>
                    <p className="mt-0.5 text-[var(--muted-foreground)]">
                      {item.opcao?.texto ??
                        item.textoLivre ??
                        (item.valorEscala !== null ? `Nota: ${item.valorEscala}` : "—")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

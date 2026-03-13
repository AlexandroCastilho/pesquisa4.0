import { notFound, redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { listarRespostasDaPesquisa } from "@/services/resposta.service";

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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="page-title">Resultados</h1>
      <p className="page-subtitle">{pesquisa.titulo}</p>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        {respostas.length} resposta(s) coletada(s)
      </p>

      {respostas.length === 0 ? (
        <div className="mt-12 text-center text-[var(--muted-foreground)]">
          Nenhuma resposta recebida ainda.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {respostas.map((r) => (
            <div key={r.id} className="app-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-[var(--card-foreground)]">{r.envio.nome}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{r.envio.email}</p>
              </div>
              <div className="space-y-3">
                {r.itens.map((item) => (
                  <div key={item.id} className="text-sm">
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

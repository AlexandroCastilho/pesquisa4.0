import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthTenantContext } from "@/lib/auth-context";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { BadgeStatus } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

export default async function PesquisaDetalhe({ params }: Props) {
  const { id } = await params;
  const ctx = await requireAuthTenantContext();

  const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
  if (!pesquisa) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{pesquisa.titulo}</h1>
          {pesquisa.descricao && (
            <p className="page-subtitle">{pesquisa.descricao}</p>
          )}
        </div>
        <BadgeStatus status={pesquisa.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <NavCard
          href={`/pesquisas/${id}/perguntas`}
          title="Perguntas"
          description={`${pesquisa.perguntas.length} pergunta(s) cadastrada(s)`}
        />
        <NavCard
          href={`/pesquisas/${id}/envios`}
          title="Envios"
          description={`${pesquisa._count.envios} envio(s)`}
        />
        <NavCard
          href={`/pesquisas/${id}/resultados`}
          title="Resultados"
          description="Ver respostas coletadas"
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="app-card app-card-hover p-6"
    >
      <h2 className="font-semibold text-lg text-[var(--card-foreground)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
    </Link>
  );
}

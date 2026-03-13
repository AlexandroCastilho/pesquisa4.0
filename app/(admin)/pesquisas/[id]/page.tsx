import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { BadgeStatus } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

export default async function PesquisaDetalhe({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pesquisa = await buscarPesquisa(id, user!.id);
  if (!pesquisa) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{pesquisa.titulo}</h1>
          {pesquisa.descricao && (
            <p className="mt-1 text-slate-600">{pesquisa.descricao}</p>
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
      className="bg-white rounded-xl shadow p-6 hover:bg-slate-50 transition"
    >
      <h2 className="font-semibold text-lg text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

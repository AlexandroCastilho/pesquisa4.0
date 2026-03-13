import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarEnvios } from "@/services/envio.service";
import { buscarPesquisa } from "@/services/pesquisa.service";
import { EnviosPanel } from "@/components/pesquisas/envios-panel";

type Props = { params: Promise<{ id: string }> };

export default async function EnviosPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pesquisa = await buscarPesquisa(id, user!.id);
  if (!pesquisa) notFound();

  const envios = await listarEnvios(id, user!.id);
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

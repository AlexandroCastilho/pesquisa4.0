import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listarPesquisas } from "@/services/pesquisa.service";
import { BadgeStatus } from "@/components/ui/badge";

export default async function PesquisasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pesquisas = await listarPesquisas(user!.id);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Pesquisas</h1>
        <Link
          href="/pesquisas/nova"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 transition"
        >
          + Nova pesquisa
        </Link>
      </div>

      {pesquisas.length === 0 ? (
        <div className="mt-12 text-center text-slate-500">
          Nenhuma pesquisa criada ainda.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pesquisas.map((p) => (
            <Link
              key={p.id}
              href={`/pesquisas/${p.id}`}
              className="flex items-center justify-between bg-white rounded-xl shadow px-6 py-4 hover:bg-slate-50 transition"
            >
              <div>
                <p className="font-semibold text-slate-900">{p.titulo}</p>
                <p className="text-sm text-slate-500 mt-0.5">
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

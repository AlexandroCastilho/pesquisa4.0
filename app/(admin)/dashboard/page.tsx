import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrismaClient } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const prisma = getPrismaClient();

  const [totalPesquisas, totalEnvios, respondidos] = await Promise.all([
    prisma.pesquisa.count({ where: { profileId: user!.id } }),
    prisma.envio.count({
      where: { pesquisa: { profileId: user!.id } },
    }),
    prisma.envio.count({
      where: { pesquisa: { profileId: user!.id }, status: "RESPONDIDO" },
    }),
  ]);

  const taxaResposta =
    totalEnvios > 0 ? Math.round((respondidos / totalEnvios) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">Visão geral do sistema de pesquisas.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard label="Pesquisas" value={totalPesquisas} />
        <StatCard label="Envios" value={totalEnvios} />
        <StatCard label="Respondidos" value={respondidos} />
        <StatCard label="Taxa de resposta" value={`${taxaResposta}%`} />
      </div>

      <div className="mt-10">
        <Link
          href="/pesquisas/nova"
          className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-white font-medium hover:bg-slate-800 transition"
        >
          + Nova pesquisa
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

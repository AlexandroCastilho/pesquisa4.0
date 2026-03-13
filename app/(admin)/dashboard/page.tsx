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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do sistema de pesquisas.</p>
        </div>

        <Link href="/pesquisas/nova" className="btn-primary">
          + Nova pesquisa
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard label="Pesquisas" value={totalPesquisas} />
        <StatCard label="Envios" value={totalEnvios} />
        <StatCard label="Respondidos" value={respondidos} />
        <StatCard label="Taxa de resposta" value={`${taxaResposta}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="app-card p-6 app-card-hover">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--card-foreground)]">{value}</p>
    </div>
  );
}

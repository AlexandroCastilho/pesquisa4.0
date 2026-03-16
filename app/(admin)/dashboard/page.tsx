import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";
import { getPrismaClient } from "@/lib/prisma";
import { DashboardTendencias } from "@/components/dashboard/tendencias";

export default async function DashboardPage() {
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  const prisma = getPrismaClient();

  const [totalPesquisas, totalEnvios, respondidos] = await Promise.all([
    prisma.pesquisa.count({ where: { empresaId: ctx.empresa.id } }),
    prisma.envio.count({
      where: { pesquisa: { empresaId: ctx.empresa.id } },
    }),
    prisma.envio.count({
      where: { pesquisa: { empresaId: ctx.empresa.id }, status: "RESPONDIDO" },
    }),
  ]);

  const taxaResposta =
    totalEnvios > 0 ? Math.round((respondidos / totalEnvios) * 100) : 0;

  return (
    <div className="space-y-6 reveal-up">
      <div className="app-card p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--accent)]/60 blur-2xl" />
        <div className="absolute right-16 top-8 h-24 w-24 rounded-full bg-[var(--primary)]/20 blur-xl" />
        <div className="page-header relative">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão consolidada das pesquisas e engajamento de respostas.</p>
          </div>

          <Link href="/pesquisas/nova" className="btn-primary">
            + Nova pesquisa
          </Link>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Resumo rápido</h2>
          <p className="page-subtitle">Indicadores principais para decisão diária.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatCard label="Pesquisas" value={totalPesquisas} tone="primary" />
        <StatCard label="Envios" value={totalEnvios} tone="neutral" />
        <StatCard label="Respondidos" value={respondidos} tone="success" />
        <StatCard label="Taxa de resposta" value={`${taxaResposta}%`} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="app-card p-5 lg:p-6 lg:col-span-2">
          <p className="text-sm text-[var(--muted-foreground)]">Ações rápidas</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/pesquisas/nova" className="btn-primary justify-center">Criar pesquisa</Link>
            <Link href="/pesquisas" className="btn-secondary justify-center">Ver pesquisas</Link>
            <Link href="/dashboard" className="btn-ghost justify-center">Atualizar visão</Link>
          </div>
        </div>

        <div className="app-card p-5 lg:p-6">
          <p className="text-sm text-[var(--muted-foreground)]">Resumo de performance</p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-[var(--foreground)]">Envios sem resposta: <strong>{Math.max(totalEnvios - respondidos, 0)}</strong></p>
            <p className="text-[var(--foreground)]">Meta sugerida de taxa: <strong>60%</strong></p>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
            <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(taxaResposta, 100)}%` }} />
          </div>
        </div>
      </div>

      <DashboardTendencias />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "primary" | "neutral" | "success" | "warning";
}) {
  const toneClass = {
    primary: "border-[color:var(--primary)]/25",
    neutral: "",
    success: "border-emerald-200",
    warning: "border-amber-200",
  }[tone];

  return (
    <div className={`app-card app-card-hover kpi-card p-5 lg:p-6 ${toneClass}`}>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[var(--card-foreground)]">{value}</p>
    </div>
  );
}

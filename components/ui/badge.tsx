import type { PesquisaStatus } from "@/types/pesquisa";

const statusConfig: Record<PesquisaStatus, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "bg-slate-100 text-slate-700 border border-slate-200" },
  ATIVA: { label: "Ativa", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ENCERRADA: { label: "Encerrada", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

const badgeBase = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

export function BadgeStatus({ status }: { status: PesquisaStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.RASCUNHO;
  return (
    <span className={`${badgeBase} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

import type { EnvioStatus } from "@/types/envio";
import type { Role } from "@/types/role";

const envioStatusConfig: Record<EnvioStatus, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-700 border border-slate-200" },
  PROCESSANDO: { label: "Processando", className: "bg-sky-50 text-sky-700 border border-sky-200" },
  ENVIADO: { label: "Enviado", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  RESPONDIDO: { label: "Respondido", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  EXPIRADO: { label: "Expirado", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  ERRO: { label: "Erro", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

export function BadgeEnvioStatus({ status }: { status: EnvioStatus }) {
  const { label, className } = envioStatusConfig[status] ?? envioStatusConfig.PENDENTE;
  return (
    <span className={`${badgeBase} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  OWNER: { label: "Owner", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  ADMIN: { label: "Admin", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  MEMBER: { label: "Member", className: "bg-slate-100 text-slate-700 border border-slate-200" },
};

export function BadgeRole({ role }: { role: Role }) {
  const { label, className } = roleConfig[role];
  return (
    <span className={`${badgeBase} ${className}`}>
      {label}
    </span>
  );
}

export function BadgeAtivo({ ativo }: { ativo: boolean }) {
  const className = ativo
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-rose-50 text-rose-700 border border-rose-200";

  return (
    <span className={`${badgeBase} ${className}`}>
      {ativo ? "Ativo" : "Desativado"}
    </span>
  );
}

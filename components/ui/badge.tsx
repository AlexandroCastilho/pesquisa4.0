import type { PesquisaStatus } from "@/types/pesquisa";

const statusConfig: Record<PesquisaStatus, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "bg-slate-100 text-slate-700 border border-slate-200" },
  ATIVA: { label: "Ativa", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ENCERRADA: { label: "Encerrada", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

export function BadgeStatus({ status }: { status: PesquisaStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.RASCUNHO;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

import type { EnvioStatus } from "@/types/envio";

const envioStatusConfig: Record<EnvioStatus, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-700 border border-slate-200" },
  ENVIADO: { label: "Enviado", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  RESPONDIDO: { label: "Respondido", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  EXPIRADO: { label: "Expirado", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  ERRO: { label: "Erro", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

export function BadgeEnvioStatus({ status }: { status: EnvioStatus }) {
  const { label, className } = envioStatusConfig[status] ?? envioStatusConfig.PENDENTE;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

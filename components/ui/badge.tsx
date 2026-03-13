import type { PesquisaStatus } from "@/types/pesquisa";

const statusConfig: Record<PesquisaStatus, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "bg-slate-100 text-slate-600" },
  ATIVA: { label: "Ativa", className: "bg-green-100 text-green-700" },
  ENCERRADA: { label: "Encerrada", className: "bg-red-100 text-red-600" },
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
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-600" },
  ENVIADO: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  RESPONDIDO: { label: "Respondido", className: "bg-green-100 text-green-700" },
  EXPIRADO: { label: "Expirado", className: "bg-amber-100 text-amber-700" },
  ERRO: { label: "Erro", className: "bg-red-100 text-red-600" },
};

export function BadgeEnvioStatus({ status }: { status: EnvioStatus }) {
  const { label, className } = envioStatusConfig[status] ?? envioStatusConfig.PENDENTE;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

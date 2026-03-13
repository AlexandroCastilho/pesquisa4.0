export type DisparoJobStatus = "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";

export type DisparoJob = {
  id: string;
  status: DisparoJobStatus;
  total: number;
  processados: number;
  enviados: number;
  erros: number;
  pendentes: number;
  emProcessamento: number;
  retriesPendentes: number;
  retriesProntos: number;
  percentual: number;
  emAndamento: boolean;
  proximoRetryEm?: string | Date | null;
  lockAt?: string | Date | null;
  ultimoErro?: string | null;
  criadoEm: string | Date;
  iniciadoEm?: string | Date | null;
  finalizadoEm?: string | Date | null;
};

export type DisparoJobStatus = "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";

export type DisparoJob = {
  id: string;
  status: DisparoJobStatus;
  total: number;
  processados: number;
  enviados: number;
  erros: number;
  pendentes: number;
  percentual: number;
  emAndamento: boolean;
  criadoEm: string | Date;
  iniciadoEm?: string | Date | null;
  finalizadoEm?: string | Date | null;
};

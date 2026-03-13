export type EnvioStatus = "PENDENTE" | "PROCESSANDO" | "ENVIADO" | "RESPONDIDO" | "EXPIRADO" | "ERRO";

export interface Envio {
  id: string;
  pesquisaId: string;
  nome: string;
  email: string;
  token: string;
  status: EnvioStatus;
  tentativas: number;
  ultimaTentativaEm?: string | Date | null;
  proximoRetryEm?: string | Date | null;
  erroCodigo?: string | null;
  enviadoEm?: string | Date | null;
  respondidoEm?: string | Date | null;
  expiraEm?: string | Date | null;
  erroMsg?: string | null;
  criadoEm: string | Date;
}

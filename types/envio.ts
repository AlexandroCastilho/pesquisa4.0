export type EnvioStatus = "PENDENTE" | "ENVIADO" | "RESPONDIDO" | "EXPIRADO" | "ERRO";

export interface Envio {
  id: string;
  pesquisaId: string;
  nome: string;
  email: string;
  token: string;
  status: EnvioStatus;
  enviadoEm?: string | Date | null;
  respondidoEm?: string | Date | null;
  expiraEm?: string | Date | null;
  erroMsg?: string | null;
  criadoEm: string | Date;
}

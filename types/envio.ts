export type EnvioStatus = "PENDENTE" | "ENVIADO" | "RESPONDIDO" | "EXPIRADO" | "ERRO";

export interface Envio {
  id: string;
  pesquisaId: string;
  nome: string;
  email: string;
  token: string;
  status: EnvioStatus;
  enviadoEm?: Date | null;
  respondidoEm?: Date | null;
  expiraEm?: Date | null;
  erroMsg?: string | null;
  criadoEm: Date;
}

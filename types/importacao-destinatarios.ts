export type FormatoImportacaoDestinatarios = "CSV_SIMPLE" | "CSV_ERP" | "XLSX";

export type DestinatarioImportado = {
  nome: string;
  email: string;
};

export type RejeicaoImportacao = {
  linha: number;
  motivo: string;
  valor: string;
};

export type ResumoImportacao = {
  total: number;
  validos: number;
  invalidos: number;
  duplicados: number;
  rejeicoes: RejeicaoImportacao[];
};

export type ImportacaoDestinatariosLote = {
  id: string;
  formato: FormatoImportacaoDestinatarios | string;
  nomeArquivo?: string | null;
  totalLinhas: number;
  validos: number;
  invalidos: number;
  duplicados: number;
  criadaEm: string | Date;
  profileId?: string | null;
  rejeicoes?: RejeicaoImportacao[] | null;
};

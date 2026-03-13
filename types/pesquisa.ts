export type PesquisaStatus = "RASCUNHO" | "ATIVA" | "ENCERRADA";

export interface Pesquisa {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: PesquisaStatus;
  empresaId: string;
  profileId: string;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface PesquisaComContagem extends Pesquisa {
  _count: {
    perguntas: number;
    envios: number;
  };
}

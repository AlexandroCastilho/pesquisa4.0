export interface RespostaItem {
  perguntaId: string;
  opcaoId?: string | null;
  textoLivre?: string | null;
  valorEscala?: number | null;
}

export interface Resposta {
  id: string;
  envioId: string;
  itens: RespostaItem[];
  criadaEm: Date;
}

export type RespostaEscalaItem = {
  perguntaId: string;
  valorEscala: number;
  opcaoId?: never;
  textoLivre?: never;
};

export type RespostaTextoItem = {
  perguntaId: string;
  textoLivre: string;
  opcaoId?: never;
  valorEscala?: never;
};

export type RespostaEscolhaItem = {
  perguntaId: string;
  opcaoId: string;
  textoLivre?: never;
  valorEscala?: never;
};

export type RespostaItem = RespostaEscalaItem | RespostaTextoItem | RespostaEscolhaItem;

export interface Resposta {
  id: string;
  envioId: string;
  itens: RespostaItem[];
  criadaEm: Date;
}

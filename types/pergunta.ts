export type TipoPergunta = "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE" | "ESCALA";

export interface Opcao {
  id: string;
  texto: string;
  ordem: number;
  perguntaId: string;
}

export interface Pergunta {
  id: string;
  texto: string;
  tipo: TipoPergunta;
  ordem: number;
  pesquisaId: string;
  opcoes: Opcao[];
}

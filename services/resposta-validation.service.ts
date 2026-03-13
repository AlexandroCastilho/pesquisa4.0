import type { TipoPergunta } from "@prisma/client";
import type { RespostaInput } from "@/lib/validation/pesquisa";

export const RESPOSTA_ERROS = {
  TOKEN_INVALIDO: "Token inválido.",
  TOKEN_EXPIRADO: "Token expirado.",
  PESQUISA_JA_RESPONDIDA: "Pesquisa já respondida.",
  DADOS_INCONSISTENTES: "Dados inconsistentes.",
} as const;

type PerguntaComOpcoes = {
  id: string;
  tipo: TipoPergunta;
  opcoes: Array<{ id: string }>;
};

function erroDadosInconsistentes(detail: string): never {
  throw new Error(`${RESPOSTA_ERROS.DADOS_INCONSISTENTES} ${detail}`);
}

function normalizarTextoLivre(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function garantirValorUnicoPorItem(item: RespostaInput["itens"][number], index: number) {
  const textoLivre = normalizarTextoLivre(item.textoLivre);
  const preenchidos = [item.opcaoId, textoLivre, item.valorEscala].filter(
    (value) => value !== undefined && value !== null
  ).length;

  if (preenchidos !== 1) {
    erroDadosInconsistentes(
      `Item ${index + 1}: cada resposta deve conter exatamente um entre opcaoId, textoLivre ou valorEscala.`
    );
  }
}

function validarItemPorTipo({
  item,
  pergunta,
  index,
}: {
  item: RespostaInput["itens"][number];
  pergunta: PerguntaComOpcoes;
  index: number;
}) {
  if (pergunta.tipo === "ESCALA") {
    if (typeof item.valorEscala !== "number") {
      erroDadosInconsistentes(`Item ${index + 1}: pergunta de escala aceita apenas valorEscala.`);
    }
    return;
  }

  if (pergunta.tipo === "TEXTO_LIVRE") {
    if (!normalizarTextoLivre(item.textoLivre)) {
      erroDadosInconsistentes(`Item ${index + 1}: pergunta de texto aceita apenas texto válido.`);
    }
    return;
  }

  if (!item.opcaoId) {
    erroDadosInconsistentes(`Item ${index + 1}: pergunta de escolha aceita apenas opcaoId válido.`);
  }

  const opcaoValida = pergunta.opcoes.some((opcao) => opcao.id === item.opcaoId);
  if (!opcaoValida) {
    erroDadosInconsistentes(
      `Item ${index + 1}: a opção informada não pertence à pergunta correta.`
    );
  }
}

export function validarIntegridadeResposta({
  itens,
  perguntas,
}: {
  itens: RespostaInput["itens"];
  perguntas: PerguntaComOpcoes[];
}) {
  if (itens.length === 0) {
    erroDadosInconsistentes("Envie ao menos uma resposta.");
  }

  if (perguntas.length === 0) {
    erroDadosInconsistentes("A pesquisa não possui perguntas disponíveis para resposta.");
  }

  const perguntasPorId = new Map(perguntas.map((pergunta) => [pergunta.id, pergunta]));
  const perguntasRespondidas = new Set<string>();

  itens.forEach((item, index) => {
    if (perguntasRespondidas.has(item.perguntaId)) {
      erroDadosInconsistentes(`Item ${index + 1}: há perguntas duplicadas no payload.`);
    }

    perguntasRespondidas.add(item.perguntaId);

    const pergunta = perguntasPorId.get(item.perguntaId);
    if (!pergunta) {
      erroDadosInconsistentes(
        `Item ${index + 1}: pergunta não pertence à pesquisa vinculada ao token.`
      );
    }

    garantirValorUnicoPorItem(item, index);
    validarItemPorTipo({ item, pergunta, index });
  });

  const perguntasFaltantes = perguntas
    .filter((pergunta) => !perguntasRespondidas.has(pergunta.id))
    .map((pergunta) => pergunta.id);

  if (perguntasFaltantes.length > 0) {
    erroDadosInconsistentes(
      `Payload incompleto: faltam respostas para ${perguntasFaltantes.length} pergunta(s).`
    );
  }
}

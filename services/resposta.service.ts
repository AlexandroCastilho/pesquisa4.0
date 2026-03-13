import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type { RespostaInput } from "@/lib/validation/pesquisa";
import {
  RESPOSTA_ERROS,
  validarIntegridadeResposta,
} from "@/services/resposta-validation.service";

type EnvioEstadoResposta = {
  id: string;
  status: "PENDENTE" | "PROCESSANDO" | "ENVIADO" | "RESPONDIDO" | "EXPIRADO" | "ERRO";
  expiraEm: Date | null;
  resposta: { id: string } | null;
};

export function validarEstadoEnvioParaResposta(envio: EnvioEstadoResposta): {
  expirouAgora: boolean;
} {
  if (envio.resposta || envio.status === "RESPONDIDO") {
    throw new Error(RESPOSTA_ERROS.PESQUISA_JA_RESPONDIDA);
  }

  if (envio.status === "EXPIRADO") {
    throw new Error(RESPOSTA_ERROS.TOKEN_EXPIRADO);
  }

  const expirouAgora = Boolean(envio.expiraEm && envio.expiraEm < new Date());
  if (expirouAgora) {
    throw new Error(RESPOSTA_ERROS.TOKEN_EXPIRADO);
  }

  return { expirouAgora: false };
}

export async function buscarEnvioPorToken(token: string) {
  const prisma = getPrismaClient();

  const envio = await prisma.envio.findUnique({
    where: { token },
    include: {
      pesquisa: {
        include: {
          perguntas: {
            orderBy: { ordem: "asc" },
            include: {
              opcoes: { orderBy: { ordem: "asc" } },
            },
          },
        },
      },
      resposta: { select: { id: true } },
    },
  });

  return envio;
}

export async function marcarEnvioComoExpiradoSeNecessario(envioId: string) {
  const prisma = getPrismaClient();
  await prisma.envio.update({
    where: { id: envioId },
    data: { status: "EXPIRADO" },
  });
}

export async function registrarResposta(token: string, input: RespostaInput) {
  const prisma = getPrismaClient();

  try {
    return await prisma.$transaction(async (tx) => {
      const envio = await tx.envio.findUnique({
        where: { token },
        select: {
          id: true,
          status: true,
          expiraEm: true,
          resposta: { select: { id: true } },
          pesquisa: {
            select: {
              perguntas: {
                select: {
                  id: true,
                  tipo: true,
                  opcoes: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!envio) throw new Error(RESPOSTA_ERROS.TOKEN_INVALIDO);

      const expirouAgora = Boolean(envio.expiraEm && envio.expiraEm < new Date());
      if (expirouAgora) {
        await tx.envio.update({ where: { id: envio.id }, data: { status: "EXPIRADO" } });
        throw new Error(RESPOSTA_ERROS.TOKEN_EXPIRADO);
      }

      validarEstadoEnvioParaResposta({
        id: envio.id,
        status: envio.status,
        expiraEm: envio.expiraEm,
        resposta: envio.resposta,
      });

      validarIntegridadeResposta({
        itens: input.itens,
        perguntas: envio.pesquisa.perguntas,
      });

      const resposta = await tx.resposta.create({
        data: {
          envioId: envio.id,
          itens: {
            create: input.itens.map((item) => ({
              perguntaId: item.perguntaId,
              opcaoId: item.opcaoId ?? null,
              textoLivre: item.textoLivre ?? null,
              valorEscala: item.valorEscala ?? null,
            })),
          },
        },
      });

      await tx.envio.update({
        where: { id: envio.id },
        data: { status: "RESPONDIDO", respondidoEm: new Date() },
      });

      return resposta;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(RESPOSTA_ERROS.PESQUISA_JA_RESPONDIDA);
    }

    throw error;
  }
}

export async function listarRespostasDaPesquisa(
  pesquisaId: string,
  empresaId: string
) {
  const prisma = getPrismaClient();

  return prisma.resposta.findMany({
    where: {
      envio: {
        pesquisaId,
        pesquisa: { empresaId },
      },
    },
    include: {
      itens: {
        include: {
          pergunta: { select: { texto: true, tipo: true } },
          opcao: { select: { texto: true } },
        },
      },
      envio: { select: { nome: true, email: true, respondidoEm: true } },
    },
    orderBy: { criadaEm: "desc" },
  });
}

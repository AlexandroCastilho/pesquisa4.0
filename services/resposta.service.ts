import { getPrismaClient } from "@/lib/prisma";
import type { RespostaInput } from "@/lib/validation/pesquisa";

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

export async function registrarResposta(token: string, input: RespostaInput) {
  const prisma = getPrismaClient();

  const envio = await prisma.envio.findUnique({
    where: { token },
    select: { id: true, status: true, expiraEm: true, resposta: { select: { id: true } } },
  });

  if (!envio) throw new Error("Link inválido.");
  if (envio.resposta) throw new Error("Esta pesquisa já foi respondida.");
  if (envio.status === "EXPIRADO") throw new Error("Este link expirou.");
  if (envio.expiraEm && envio.expiraEm < new Date()) {
    await prisma.envio.update({ where: { id: envio.id }, data: { status: "EXPIRADO" } });
    throw new Error("Este link expirou.");
  }

  const resposta = await prisma.resposta.create({
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

  await prisma.envio.update({
    where: { id: envio.id },
    data: { status: "RESPONDIDO", respondidoEm: new Date() },
  });

  return resposta;
}

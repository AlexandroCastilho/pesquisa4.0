import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type { PesquisaInput } from "@/lib/validation/pesquisa";
import type { PesquisaComContagem } from "@/types/pesquisa";

export type PesquisaDetalhe = Prisma.PesquisaGetPayload<{
  include: {
    perguntas: {
      include: {
        opcoes: true;
      };
    };
    _count: { select: { envios: true } };
  };
}>;

export async function listarPesquisas(empresaId: string): Promise<PesquisaComContagem[]> {
  const prisma = getPrismaClient();

  return prisma.pesquisa.findMany({
    where: { empresaId },
    orderBy: { criadaEm: "desc" },
    include: {
      _count: { select: { perguntas: true, envios: true } },
    },
  });
}

export async function buscarPesquisa(
  id: string,
  empresaId: string
): Promise<PesquisaDetalhe | null> {
  const prisma = getPrismaClient();

  return prisma.pesquisa.findFirst({
    where: { id, empresaId },
    include: {
      perguntas: {
        orderBy: { ordem: "asc" },
        include: {
          opcoes: { orderBy: { ordem: "asc" } },
        },
      },
      _count: { select: { envios: true } },
    },
  });
}

export async function criarPesquisa(
  empresaId: string,
  profileId: string,
  data: PesquisaInput
) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      empresaId,
      profileId,
    },
  });
}

export async function atualizarPesquisa(
  id: string,
  empresaId: string,
  data: PesquisaInput
) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.updateMany({
    where: { id, empresaId },
    data: {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      status: data.status,
    },
  });
}

export async function deletarPesquisa(id: string, empresaId: string) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.deleteMany({
    where: { id, empresaId },
  });
}

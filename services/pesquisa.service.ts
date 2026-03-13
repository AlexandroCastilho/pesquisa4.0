import { getPrismaClient } from "@/lib/prisma";
import type { PesquisaInput } from "@/lib/validation/pesquisa";

export async function listarPesquisas(profileId: string) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.findMany({
    where: { profileId },
    orderBy: { criadaEm: "desc" },
    include: {
      _count: { select: { perguntas: true, envios: true } },
    },
  });
}

export async function buscarPesquisa(id: string, profileId: string) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.findFirst({
    where: { id, profileId },
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

export async function criarPesquisa(profileId: string, data: PesquisaInput) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      profileId,
    },
  });
}

export async function atualizarPesquisa(
  id: string,
  profileId: string,
  data: PesquisaInput
) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.updateMany({
    where: { id, profileId },
    data: {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      status: data.status,
    },
  });
}

export async function deletarPesquisa(id: string, profileId: string) {
  const prisma = getPrismaClient();

  return prisma.pesquisa.deleteMany({
    where: { id, profileId },
  });
}

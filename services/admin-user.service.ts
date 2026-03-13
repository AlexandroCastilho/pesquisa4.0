import type { Role } from "@prisma/client";
import { canAssignRole, canEditTargetUser } from "@/lib/access-control";
import { getPrismaClient } from "@/lib/prisma";

type Actor = {
  id: string;
  role: Role;
  empresaId: string;
};

export async function listarUsuariosDaEmpresa(empresaId: string) {
  const prisma = getPrismaClient();

  return prisma.profile.findMany({
    where: { empresaId },
    orderBy: [{ role: "asc" }, { criadoEm: "asc" }],
    select: {
      id: true,
      name: true,
      company: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

export async function atualizarAcessoUsuario({
  actor,
  targetUserId,
  role,
  ativo,
}: {
  actor: Actor;
  targetUserId: string;
  role?: Role;
  ativo?: boolean;
}) {
  const prisma = getPrismaClient();

  const target = await prisma.profile.findFirst({
    where: { id: targetUserId, empresaId: actor.empresaId },
    select: {
      id: true,
      role: true,
      ativo: true,
      empresaId: true,
    },
  });

  if (!target) {
    throw new Error("Usuário não encontrado na sua empresa.");
  }

  if (!canEditTargetUser(actor.role, target.role)) {
    throw new Error("Você não tem permissão para alterar este usuário.");
  }

  if (role && !canAssignRole(actor.role, role)) {
    throw new Error("Você não tem permissão para atribuir esse papel.");
  }

  if (target.id === actor.id && ativo === false) {
    throw new Error("Você não pode desativar a própria conta.");
  }

  if (target.id === actor.id && role && actor.role === "OWNER" && role !== "OWNER") {
    const ownersAtivos = await prisma.profile.count({
      where: {
        empresaId: actor.empresaId,
        role: "OWNER",
        ativo: true,
      },
    });

    if (ownersAtivos <= 1) {
      throw new Error("Não é possível remover o último OWNER ativo da empresa.");
    }
  }

  if (target.role === "OWNER" && actor.role !== "OWNER") {
    throw new Error("Apenas um OWNER pode alterar outro OWNER.");
  }

  if (target.role === "OWNER" && ativo === false) {
    const ownersAtivos = await prisma.profile.count({
      where: {
        empresaId: actor.empresaId,
        role: "OWNER",
        ativo: true,
      },
    });

    if (target.ativo && ownersAtivos <= 1) {
      throw new Error("Não é possível desativar o último OWNER ativo da empresa.");
    }
  }

  return prisma.profile.update({
    where: { id: target.id },
    data: {
      role,
      ativo,
    },
    select: {
      id: true,
      name: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
  });
}
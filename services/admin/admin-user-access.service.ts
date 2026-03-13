import type { Role } from "@/types/role";
import { canAssignRole, canEditTargetUser, canManageUsers } from "@/lib/access-control";
import { getPrismaClient } from "@/lib/prisma";

type Actor = {
  id: string;
  role: Role;
  empresaId: string;
};

function assertActorCanManageUsers(actorRole: Role) {
  if (!canManageUsers(actorRole)) {
    throw new Error("Você não tem permissão para gerenciar usuários da empresa.");
  }
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
  assertActorCanManageUsers(actor.role);
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const target = await tx.profile.findFirst({
      where: { id: targetUserId, empresaId: actor.empresaId },
      select: {
        id: true,
        name: true,
        role: true,
        ativo: true,
        criadoEm: true,
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

    if (target.id === actor.id && role && role !== actor.role) {
      throw new Error("Você não pode alterar o papel da própria conta.");
    }

    if (target.role === "OWNER" && actor.role !== "OWNER") {
      throw new Error("Apenas um OWNER pode alterar outro OWNER.");
    }

    const nextRole = role ?? target.role;
    const nextAtivo = ativo ?? target.ativo;

    if (target.role === "OWNER" && (nextRole !== "OWNER" || nextAtivo === false)) {
      const ownersAtivos = await tx.profile.count({
        where: {
          empresaId: actor.empresaId,
          role: "OWNER",
          ativo: true,
        },
      });

      const ownerAtualEhAtivo = target.ativo;
      const ownerVaiDeixarDeSerAtivo = ownerAtualEhAtivo && (nextRole !== "OWNER" || nextAtivo === false);

      if (ownerVaiDeixarDeSerAtivo && ownersAtivos <= 1) {
        throw new Error("Não é possível remover ou desativar o último OWNER ativo da empresa.");
      }
    }

    return tx.profile.update({
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
  });
}
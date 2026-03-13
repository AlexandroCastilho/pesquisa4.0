import { getPrismaClient } from "@/lib/prisma";
import type { AdminCompanySummary, AdminUser } from "@/types/admin-user";

export async function listarUsuariosDaEmpresa(empresaId: string): Promise<AdminUser[]> {
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

export async function obterResumoEmpresaAdmin(empresaId: string): Promise<AdminCompanySummary> {
  const prisma = getPrismaClient();

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nome: true, slug: true, criadaEm: true },
  });

  if (!empresa) {
    throw new Error("Empresa não encontrada.");
  }

  const [totalUsuarios, ativos, owners, admins, members] = await Promise.all([
    prisma.profile.count({ where: { empresaId } }),
    prisma.profile.count({ where: { empresaId, ativo: true } }),
    prisma.profile.count({ where: { empresaId, role: "OWNER" } }),
    prisma.profile.count({ where: { empresaId, role: "ADMIN" } }),
    prisma.profile.count({ where: { empresaId, role: "MEMBER" } }),
  ]);

  return {
    ...empresa,
    totalUsuarios,
    ativos,
    inativos: Math.max(totalUsuarios - ativos, 0),
    owners,
    admins,
    members,
  };
}
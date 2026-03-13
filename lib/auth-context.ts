import type { Role } from "@prisma/client";
import { canAccessAdmin, canManagePesquisas, canManageUsers } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { getPrismaClient } from "@/lib/prisma";

type AuthTenantProfile = {
  id: string;
  name: string | null;
  company: string | null;
  role: Role;
  ativo: boolean;
  empresaId: string;
  criadoEm: Date;
};

type AuthTenantEmpresa = {
  id: string;
  nome: string;
  slug: string | null;
  criadaEm: Date;
  atualizadaEm: Date;
};

type TenantTransactionClient = {
  profile: {
    findUnique(args: { where: { id: string } }): Promise<AuthTenantProfile | null>;
    upsert(args: {
      where: { id: string };
      update: Partial<Pick<AuthTenantProfile, "name" | "company" | "empresaId" | "role" | "ativo">>;
      create: {
        id: string;
        name: string | null;
        company: string | null;
        empresaId: string;
        role: Role;
        ativo: boolean;
      };
    }): Promise<AuthTenantProfile>;
  };
  empresa: {
    create(args: {
      data: { nome: string; slug: string };
    }): Promise<AuthTenantEmpresa>;
  };
};

type TenantPrismaClient = TenantTransactionClient & {
  empresa: {
    findUnique(args: { where: { id: string } }): Promise<AuthTenantEmpresa | null>;
    create(args: {
      data: { nome: string; slug: string };
    }): Promise<AuthTenantEmpresa>;
  };
  $transaction<T>(fn: (tx: TenantTransactionClient) => Promise<T>): Promise<T>;
};

type AuthTenantContext = {
  user: {
    id: string;
    email: string | undefined;
  };
  profile: AuthTenantProfile;
  empresa: AuthTenantEmpresa;
};

export async function getAuthTenantContext(): Promise<AuthTenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const prisma = getPrismaClient() as unknown as TenantPrismaClient;
  const metadataName = user.user_metadata?.name ?? null;
  const metadataCompany = user.user_metadata?.company ?? null;

  const profile = await prisma.$transaction(async (tx) => {
    const existing = await tx.profile.findUnique({
      where: { id: user.id },
    });

    if (existing?.empresaId) {
      return existing;
    }

    const companyBase = (metadataCompany ?? metadataName ?? "Empresa")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    const empresa = await tx.empresa.create({
      data: {
        nome: metadataCompany ?? metadataName ?? `Empresa ${user.id.slice(0, 6)}`,
        slug: `${companyBase || "empresa"}-${user.id.slice(0, 6)}`,
      },
    });

    await tx.profile.upsert({
      where: { id: user.id },
      update: {
        name: metadataName,
        company: metadataCompany,
        empresaId: empresa.id,
      },
      create: {
        id: user.id,
        name: metadataName,
        company: metadataCompany,
        empresaId: empresa.id,
        role: "OWNER" as Role,
        ativo: true,
      },
    });

    return tx.profile.findUnique({
      where: { id: user.id },
    });
  });

  if (!profile?.empresaId) {
    return null;
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: profile.empresaId },
  });

  if (!empresa) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    empresa,
  };
}

export async function requireAuthTenantContext(): Promise<AuthTenantContext> {
  const ctx = await getAuthTenantContext();
  if (!ctx) {
    throw new Error("Sessão inválida ou perfil sem empresa.");
  }
  if (!ctx.profile.ativo) {
    throw new Error("Sua conta está desativada. Fale com o administrador da sua empresa.");
  }
  return ctx;
}

export async function requireAdminTenantContext(): Promise<AuthTenantContext> {
  const ctx = await requireAuthTenantContext();
  if (!canAccessAdmin(ctx.profile.role)) {
    throw new Error("Acesso negado. Esta área é restrita a administradores da empresa.");
  }
  return ctx;
}

export function assertCanManagePesquisa(profile: { role: Role }): void {
  if (!canManagePesquisas(profile.role)) {
    throw new Error("Você não tem permissão para gerenciar pesquisas.");
  }
}

export function assertCanManageUsers(profile: { role: Role }): void {
  if (!canManageUsers(profile.role)) {
    throw new Error("Você não tem permissão para gerenciar usuários da empresa.");
  }
}

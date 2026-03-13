import type { Role } from "@/types/role";
import { getPrismaClient } from "@/lib/prisma";
import {
  ProfileNotFoundError,
  UserWithoutEmpresaError,
} from "@/lib/auth/auth-errors";
import type {
  AuthUserIdentity,
  TenantEmpresa,
  TenantProfile,
} from "@/lib/auth/auth-types";

type BootstrapInput = {
  user: AuthUserIdentity;
  preferredName?: string | null;
  preferredCompany?: string | null;
};

type TxClient = Parameters<
  Parameters<ReturnType<typeof getPrismaClient>["$transaction"]>[0]
>[0];

function cleanText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function companySlugBase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function metadataString(value: unknown): string | null {
  return typeof value === "string" ? cleanText(value) : null;
}

async function ensureOwnerExists(profile: TenantProfile): Promise<void> {
  const prisma = getPrismaClient();
  const owners = await prisma.profile.count({
    where: {
      empresaId: profile.empresaId,
      role: "OWNER",
    },
  });

  if (owners === 0 && profile.role !== "OWNER") {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { role: "OWNER" },
    });
  }
}

export async function ensureTenantBootstrap(input: BootstrapInput): Promise<{
  profile: TenantProfile;
  empresa: TenantEmpresa;
}> {
  const prisma = getPrismaClient();

  const metadataName = metadataString(input.user.user_metadata?.name);
  const metadataCompany = metadataString(input.user.user_metadata?.company);
  const preferredName = cleanText(input.preferredName ?? metadataName);
  const preferredCompany = cleanText(input.preferredCompany ?? metadataCompany);

  const profileWithEmpresa = await prisma.$transaction(async (tx: TxClient) => {
    const existingProfile = await tx.profile.findUnique({
      where: { id: input.user.id },
      include: { empresa: true },
    });

    if (existingProfile?.empresaId && existingProfile.empresa) {
      const profileUpdate: {
        name?: string | null;
        company?: string | null;
      } = {};

      if (preferredName && preferredName !== existingProfile.name) {
        profileUpdate.name = preferredName;
      }

      if (preferredCompany && preferredCompany !== existingProfile.company) {
        profileUpdate.company = preferredCompany;
      }

      if (Object.keys(profileUpdate).length > 0) {
        await tx.profile.update({
          where: { id: existingProfile.id },
          data: profileUpdate,
        });
      }

      return tx.profile.findUnique({
        where: { id: existingProfile.id },
        include: { empresa: true },
      });
    }

    const empresaNome =
      preferredCompany ??
      preferredName ??
      `Empresa ${input.user.id.slice(0, 6)}`;

    const slugBase = companySlugBase(empresaNome);

    const empresa = await tx.empresa.create({
      data: {
        nome: empresaNome,
        slug: `${slugBase || "empresa"}-${input.user.id.slice(0, 6)}`,
      },
    });

    const usersInEmpresa = await tx.profile.count({ where: { empresaId: empresa.id } });
    const role: Role = usersInEmpresa === 0 ? "OWNER" : "MEMBER";

    await tx.profile.upsert({
      where: { id: input.user.id },
      update: {
        name: preferredName,
        company: preferredCompany ?? empresaNome,
        empresaId: empresa.id,
        role,
        ativo: true,
      },
      create: {
        id: input.user.id,
        name: preferredName,
        company: preferredCompany ?? empresaNome,
        empresaId: empresa.id,
        role,
        ativo: true,
      },
    });

    return tx.profile.findUnique({
      where: { id: input.user.id },
      include: { empresa: true },
    });
  });

  if (!profileWithEmpresa) {
    throw new ProfileNotFoundError();
  }

  if (!profileWithEmpresa.empresaId || !profileWithEmpresa.empresa) {
    throw new UserWithoutEmpresaError();
  }

  await ensureOwnerExists({
    id: profileWithEmpresa.id,
    name: profileWithEmpresa.name,
    company: profileWithEmpresa.company,
    role: profileWithEmpresa.role,
    ativo: profileWithEmpresa.ativo,
    empresaId: profileWithEmpresa.empresaId,
    criadoEm: profileWithEmpresa.criadoEm,
  });

  const normalizedProfile = await prisma.profile.findUnique({
    where: { id: input.user.id },
    include: { empresa: true },
  });

  if (!normalizedProfile || !normalizedProfile.empresa) {
    throw new ProfileNotFoundError();
  }

  return {
    profile: {
      id: normalizedProfile.id,
      name: normalizedProfile.name,
      company: normalizedProfile.company,
      role: normalizedProfile.role,
      ativo: normalizedProfile.ativo,
      empresaId: normalizedProfile.empresaId,
      criadoEm: normalizedProfile.criadoEm,
    },
    empresa: {
      id: normalizedProfile.empresa.id,
      nome: normalizedProfile.empresa.nome,
      slug: normalizedProfile.empresa.slug,
      criadaEm: normalizedProfile.empresa.criadaEm,
      atualizadaEm: normalizedProfile.empresa.atualizadaEm,
    },
  };
}

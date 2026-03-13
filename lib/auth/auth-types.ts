import type { Role } from "@/types/role";

export type AuthUserIdentity = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: unknown;
    company?: unknown;
  };
};

export type TenantProfile = {
  id: string;
  name: string | null;
  company: string | null;
  role: Role;
  ativo: boolean;
  empresaId: string;
  criadoEm: Date;
};

export type TenantEmpresa = {
  id: string;
  nome: string;
  slug: string | null;
  criadaEm: Date;
  atualizadaEm: Date;
};

export type AuthTenantContext = {
  user: {
    id: string;
    email: string | undefined;
  };
  profile: TenantProfile;
  empresa: TenantEmpresa;
};

export type AuthorizationProfile = {
  role: Role;
};

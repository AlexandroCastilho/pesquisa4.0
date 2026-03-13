import { canAccessAdmin, canManagePesquisas, canManageUsers } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { InactiveUserError, SessionInvalidError } from "@/lib/auth/auth-errors";
import type { AuthTenantContext, AuthorizationProfile } from "@/lib/auth/auth-types";
import { ensureTenantBootstrap } from "@/lib/auth/tenant-bootstrap.service";

export type { AuthTenantContext } from "@/lib/auth/auth-types";

export async function getAuthTenantContext(): Promise<AuthTenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { profile, empresa } = await ensureTenantBootstrap({ user });

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
    throw new SessionInvalidError();
  }
  if (!ctx.profile.ativo) {
    throw new InactiveUserError();
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

export function assertCanManagePesquisa(profile: AuthorizationProfile): void {
  if (!canManagePesquisas(profile.role)) {
    throw new Error("Você não tem permissão para gerenciar pesquisas.");
  }
}

export function assertCanManageUsers(profile: AuthorizationProfile): void {
  if (!canManageUsers(profile.role)) {
    throw new Error("Você não tem permissão para gerenciar usuários da empresa.");
  }
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccessDeniedState } from "@/components/layout/access-denied-state";
import { Sidebar } from "@/components/layout/sidebar";
import { getAuthTenantContext } from "@/lib/auth-context";
import { canAccessAdmin, canManageUsers } from "@/lib/access-control";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const ctx = await getAuthTenantContext();

  if (!ctx) {
    redirect("/login");
  }

  if (!ctx.profile.ativo) {
    return <AccessDeniedState message="Sua conta está desativada. Fale com o administrador da sua empresa." />;
  }

  if (!canAccessAdmin(ctx.profile.role)) {
    return (
      <AccessDeniedState message="Sua conta não possui acesso ao painel administrativo. Fale com um OWNER ou ADMIN da sua empresa." />
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[var(--background)]">
      <Sidebar
        canManageUsers={canManageUsers(ctx.profile.role)}
        companyName={ctx.empresa.nome}
        role={ctx.profile.role}
      />
      <main className="flex-1 overflow-auto px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}

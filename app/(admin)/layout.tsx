import type { ReactNode } from "react";
import { AccessDeniedState } from "@/components/layout/access-denied-state";
import { Sidebar } from "@/components/layout/sidebar";
import { requireAuthTenantContext } from "@/lib/auth-context";
import { canAccessAdmin, canManageUsers } from "@/lib/access-control";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    const ctx = await requireAuthTenantContext();

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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível validar suas permissões para acessar esta área.";

    return <AccessDeniedState message={message} />;
  }
}

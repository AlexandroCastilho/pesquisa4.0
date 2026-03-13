import { redirect } from "next/navigation";
import { getAuthTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { UsersAccessPanel } from "@/components/admin/users-access-panel";
import {
  listarUsuariosDaEmpresa,
  obterResumoEmpresaAdmin,
} from "@/services/admin/admin-governance.service";

export default async function AdminUsuariosPage() {
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  assertCanManageUsers(ctx.profile);

  const [usuarios, empresa] = await Promise.all([
    listarUsuariosDaEmpresa(ctx.empresa.id),
    obterResumoEmpresaAdmin(ctx.empresa.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Governança de usuários, papéis e empresa para operação SaaS multiempresa.</p>
      </div>

      <UsersAccessPanel
        usuariosIniciais={usuarios}
        empresa={empresa}
        actorRole={ctx.profile.role}
        actorId={ctx.profile.id}
      />
    </div>
  );
}
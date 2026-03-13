import { requireAdminTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { UsersAccessPanel } from "@/components/admin/users-access-panel";
import { listarUsuariosDaEmpresa } from "@/services/admin-user.service";

export default async function AdminUsuariosPage() {
  const ctx = await requireAdminTenantContext();
  assertCanManageUsers(ctx.profile);

  const usuarios = await listarUsuariosDaEmpresa(ctx.empresa.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Gerencie usuários, papéis de acesso e status da sua empresa.</p>
      </div>

      <div className="mt-6">
        <UsersAccessPanel
          usuariosIniciais={usuarios}
          actorRole={ctx.profile.role}
          actorId={ctx.profile.id}
        />
      </div>
    </div>
  );
}
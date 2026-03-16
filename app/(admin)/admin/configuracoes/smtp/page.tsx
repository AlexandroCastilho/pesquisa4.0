import { redirect } from "next/navigation";
import { getAuthTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { getSmtpRuntimeStatus } from "@/services/email.service";
import { SmtpSettingsPanel } from "@/components/admin/smtp-settings-panel";

export default async function AdminSmtpPage() {
  const ctx = await getAuthTenantContext();

  if (!ctx || !ctx.profile.ativo) {
    redirect("/login");
  }

  assertCanManageUsers(ctx.profile);

  const status = getSmtpRuntimeStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Configurações SMTP</h1>
        <p className="page-subtitle">Alinhado ao layout do Stitch: visibilidade de configuração e teste rápido de conexão.</p>
      </div>

      <SmtpSettingsPanel initialStatus={status} />
    </div>
  );
}

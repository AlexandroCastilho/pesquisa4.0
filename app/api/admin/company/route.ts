import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { obterResumoEmpresaAdmin } from "@/services/admin/admin-governance.service";

export async function GET() {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManageUsers(ctx.profile);

    const empresa = await obterResumoEmpresaAdmin(ctx.empresa.id);
    return NextResponse.json({ empresa }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao carregar dados da empresa.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
        { includes: "Empresa não encontrada", status: 404 },
      ],
    });
  }
}
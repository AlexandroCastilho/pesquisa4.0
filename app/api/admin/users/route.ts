import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { listarUsuariosDaEmpresa } from "@/services/admin/admin-governance.service";

export async function GET() {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManageUsers(ctx.profile);

    const usuarios = await listarUsuariosDaEmpresa(ctx.empresa.id);
    return NextResponse.json({ usuarios }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao listar usuários.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}
import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { getSmtpRuntimeStatus, verifySmtpConnection } from "@/services/email.service";

export async function GET() {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManageUsers(ctx.profile);

    const status = getSmtpRuntimeStatus();
    return NextResponse.json({ status }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao consultar configuração SMTP.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

export async function POST() {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManageUsers(ctx.profile);

    const test = await verifySmtpConnection();
    const status = getSmtpRuntimeStatus();
    const code = test.ok ? 200 : 400;

    return NextResponse.json({ test, status }, { status: code });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao testar conexão SMTP.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

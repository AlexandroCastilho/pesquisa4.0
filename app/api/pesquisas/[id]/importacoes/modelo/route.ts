import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { assertCanManagePesquisa, requireAdminTenantContext } from "@/lib/auth-context";
import { gerarModeloOficialCsv } from "@/services/importacao-destinatarios.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);
    await params;

    const csv = gerarModeloOficialCsv();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=modelo-oficial-destinatarios.csv",
      },
    });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao gerar modelo oficial de importação.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

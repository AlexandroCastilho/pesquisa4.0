import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext } from "@/lib/auth-context";
import { obterJobAtivoDaPesquisa } from "@/services/envio.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    const { id: pesquisaId } = await params;

    const jobAtivo = await obterJobAtivoDaPesquisa(pesquisaId, ctx.empresa.id);
    return NextResponse.json({ jobAtivo }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao consultar job ativo da pesquisa.",
      statusRules: [
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

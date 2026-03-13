import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { assertCanManagePesquisa, requireAdminTenantContext } from "@/lib/auth-context";
import { importacaoDestinatariosSchema } from "@/lib/validation/pesquisa";
import {
  importarDestinatariosPorArquivo,
  listarImportacoesDestinatarios,
} from "@/services/importacao-destinatarios.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id: pesquisaId } = await params;
    const importacoes = await listarImportacoesDestinatarios(pesquisaId, ctx.empresa.id);

    return NextResponse.json({ importacoes }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao listar importações de destinatários.",
      statusRules: [
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id: pesquisaId } = await params;
    const body = await request.json();
    const data = importacaoDestinatariosSchema.parse(body);

    const resultado = await importarDestinatariosPorArquivo({
      pesquisaId,
      empresaId: ctx.empresa.id,
      profileId: ctx.profile.id,
      input: data,
    });

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }

    return createErrorResponse({
      error,
      message: "Falha ao importar destinatários.",
      statusRules: [
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Arquivo vazio", status: 400 },
        { includes: "Cabeçalho inválido", status: 422 },
        { includes: "não suportado", status: 422 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

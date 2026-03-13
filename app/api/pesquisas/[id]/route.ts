import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { pesquisaSchema } from "@/lib/validation/pesquisa";
import { buscarPesquisa, atualizarPesquisa, deletarPesquisa } from "@/services/pesquisa.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();

    const { id } = await params;
    const pesquisa = await buscarPesquisa(id, ctx.empresa.id);

    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    return NextResponse.json({ pesquisa });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao buscar pesquisa.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id } = await params;
    const body = await request.json();
    const data = pesquisaSchema.parse(body);

    await atualizarPesquisa(id, ctx.empresa.id, data);
    return NextResponse.json({ message: "Pesquisa atualizada." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao atualizar pesquisa.",
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

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id } = await params;
    await deletarPesquisa(id, ctx.empresa.id);
    return NextResponse.json({ message: "Pesquisa deletada." });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao deletar pesquisa.",
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

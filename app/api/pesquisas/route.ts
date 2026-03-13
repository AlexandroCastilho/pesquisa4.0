import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { pesquisaSchema } from "@/lib/validation/pesquisa";
import { listarPesquisas, criarPesquisa } from "@/services/pesquisa.service";

export async function GET() {
  try {
    const ctx = await requireAdminTenantContext();

    const pesquisas = await listarPesquisas(ctx.empresa.id);
    return NextResponse.json({ pesquisas });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao listar pesquisas.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const body = await request.json();
    const data = pesquisaSchema.parse(body);

    const pesquisa = await criarPesquisa(ctx.empresa.id, ctx.profile.id, data);
    return NextResponse.json({ pesquisa }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao criar pesquisa.",
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { disparoSchema } from "@/lib/validation/pesquisa";
import { criarDisparoJob } from "@/services/envio.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id } = await params;
    const body = await request.json();
    const data = disparoSchema.parse(body);

    const lote = await criarDisparoJob(id, ctx.empresa.id, data);
    return NextResponse.json({ lote }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao disparar pesquisa.",
      statusRules: [
        { includes: "não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

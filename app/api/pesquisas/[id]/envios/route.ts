import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext } from "@/lib/auth-context";
import { listarEnvios } from "@/services/envio.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();

    const { id } = await params;
    const envios = await listarEnvios(id, ctx.empresa.id);

    if (!envios) {
      return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ envios }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao listar envios.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

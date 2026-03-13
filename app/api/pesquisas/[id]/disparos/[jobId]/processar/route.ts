import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext } from "@/lib/auth-context";
import { acionarProcessamentoDisparo } from "@/services/disparo-job-processor.service";

type Params = { params: Promise<{ id: string; jobId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    const { id: pesquisaId, jobId } = await params;

    const { searchParams } = new URL(request.url);
    const batchSizeRaw = Number(searchParams.get("batchSize") ?? "20");
    const batchSize = Number.isFinite(batchSizeRaw)
      ? Math.max(1, Math.min(100, Math.floor(batchSizeRaw)))
      : 20;

    const ciclosRaw = Number(searchParams.get("ciclos") ?? "1");
    const ciclos = Number.isFinite(ciclosRaw)
      ? Math.max(1, Math.min(5, Math.floor(ciclosRaw)))
      : 1;

    const progresso = await acionarProcessamentoDisparo(pesquisaId, jobId, ctx.empresa.id, {
      batchSize,
      ciclos,
    });

    return NextResponse.json({ progresso }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao processar lote de disparo.",
      statusRules: [
        { includes: "Lote de disparo não encontrado", status: 404 },
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

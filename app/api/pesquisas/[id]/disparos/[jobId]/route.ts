import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext } from "@/lib/auth-context";
import { obterProgressoDisparoJob } from "@/services/envio.service";
import { acionarProcessamentoDisparo } from "@/services/disparo-job-processor.service";

type Params = { params: Promise<{ id: string; jobId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    const { id: pesquisaId, jobId } = await params;

    const { searchParams } = new URL(request.url);
    const processar = searchParams.get("processar") === "1";
    const batchSizeRaw = Number(searchParams.get("batchSize") ?? "10");
    const batchSize = Number.isFinite(batchSizeRaw)
      ? Math.max(1, Math.min(50, Math.floor(batchSizeRaw)))
      : 10;

    const progresso = processar
      ? await acionarProcessamentoDisparo(pesquisaId, jobId, ctx.empresa.id, {
          ciclos: 1,
          batchSize,
        })
      : await obterProgressoDisparoJob(pesquisaId, jobId, ctx.empresa.id);

    return NextResponse.json({ progresso }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao consultar progresso do lote.",
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

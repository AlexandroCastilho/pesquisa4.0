import { NextResponse } from "next/server";
import { requireAdminTenantContext } from "@/lib/auth-context";
import { createErrorResponse } from "@/lib/api-error";
import { getPrismaClient } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminTenantContext();
    const { searchParams } = new URL(request.url);
    const periodoRaw = searchParams.get("periodo") ?? "30";
    const periodo = [7, 30, 90].includes(Number(periodoRaw)) ? Number(periodoRaw) : 30;

    const prisma = getPrismaClient();

    const desde = new Date();
    desde.setDate(desde.getDate() - (periodo - 1));
    desde.setHours(0, 0, 0, 0);

    const [enviosRaw, respostasRaw] = await Promise.all([
      prisma.envio.findMany({
        where: {
          pesquisa: { empresaId: ctx.empresa.id },
          criadoEm: { gte: desde },
        },
        select: { criadoEm: true },
      }),
      prisma.envio.findMany({
        where: {
          pesquisa: { empresaId: ctx.empresa.id },
          status: "RESPONDIDO",
          respondidoEm: { gte: desde },
        },
        select: { respondidoEm: true },
      }),
    ]);

    // Montar mapa de dias no período
    const dias: Record<string, { envios: number; respostas: number }> = {};
    for (let i = 0; i < periodo; i++) {
      const d = new Date(desde);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dias[key] = { envios: 0, respostas: 0 };
    }

    for (const e of enviosRaw) {
      const key = e.criadoEm.toISOString().slice(0, 10);
      if (dias[key]) dias[key].envios += 1;
    }

    for (const r of respostasRaw) {
      if (!r.respondidoEm) continue;
      const key = r.respondidoEm.toISOString().slice(0, 10);
      if (dias[key]) dias[key].respostas += 1;
    }

    const dados = Object.entries(dias).map(([data, vals]) => ({ data, ...vals }));

    return NextResponse.json({ periodo, dados });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao carregar tendências.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
      ],
    });
  }
}

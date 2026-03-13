import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { getPrismaClient } from "@/lib/prisma";
import { buscarPesquisa, type PesquisaDetalhe } from "@/services/pesquisa.service";

type Params = { params: Promise<{ id: string }> };
type PerguntaDaPesquisa = PesquisaDetalhe["perguntas"][number];

const reorderSchema = z
  .object({
    orderedIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id: pesquisaId } = await params;
    const pesquisa = await buscarPesquisa(pesquisaId, ctx.empresa.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    const body = await request.json();
    const data = reorderSchema.parse(body);

    const perguntaIds = new Set(pesquisa.perguntas.map((p: PerguntaDaPesquisa) => p.id));
    const orderedIds = data.orderedIds;

    if (orderedIds.some((id) => !perguntaIds.has(id))) {
      return NextResponse.json({ message: "Dados inválidos.", detail: "Há pergunta de outra pesquisa no reorder." }, { status: 422 });
    }

    const prisma = getPrismaClient();
    await prisma.$transaction(
      orderedIds.map((perguntaId, ordem) =>
        prisma.pergunta.update({
          where: { id: perguntaId },
          data: { ordem },
        })
      )
    );

    const perguntas = await prisma.pergunta.findMany({
      where: { pesquisaId },
      orderBy: { ordem: "asc" },
      include: { opcoes: { orderBy: { ordem: "asc" } } },
    });

    return NextResponse.json({ perguntas }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }

    return createErrorResponse({
      error,
      message: "Falha ao reordenar perguntas.",
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

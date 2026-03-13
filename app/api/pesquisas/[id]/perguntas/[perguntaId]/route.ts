import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { getPrismaClient } from "@/lib/prisma";
import { buscarPesquisa } from "@/services/pesquisa.service";

type Params = { params: Promise<{ id: string; perguntaId: string }> };

const perguntaUpdateSchema = z
  .object({
    texto: z.string().trim().min(1).optional(),
    tipo: z.enum(["MULTIPLA_ESCOLHA", "TEXTO_LIVRE", "ESCALA"]).optional(),
    opcoes: z
      .array(
        z.object({
          texto: z.string().trim().min(1),
          ordem: z.number().int().min(0).optional(),
        })
      )
      .optional(),
  })
  .strict();

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id: pesquisaId, perguntaId } = await params;
    const pesquisa = await buscarPesquisa(pesquisaId, ctx.empresa.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    const body = await request.json();
    const data = perguntaUpdateSchema.parse(body);
    const prisma = getPrismaClient();

    const pergunta = await prisma.pergunta.findFirst({
      where: { id: perguntaId, pesquisaId },
      select: { id: true },
    });

    if (!pergunta) {
      return NextResponse.json({ message: "Pergunta não encontrada." }, { status: 404 });
    }

    if (data.opcoes) {
      await prisma.opcao.deleteMany({ where: { perguntaId } });
    }

    const updated = await prisma.pergunta.update({
      where: { id: perguntaId },
      data: {
        texto: data.texto,
        tipo: data.tipo,
        opcoes: data.opcoes
          ? {
              create: data.opcoes.map((opcao, idx) => ({
                texto: opcao.texto,
                ordem: opcao.ordem ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        opcoes: { orderBy: { ordem: "asc" } },
      },
    });

    return NextResponse.json({ pergunta: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao atualizar pergunta.",
      statusRules: [
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Pergunta não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id: pesquisaId, perguntaId } = await params;
    const pesquisa = await buscarPesquisa(pesquisaId, ctx.empresa.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    const prisma = getPrismaClient();
    const pergunta = await prisma.pergunta.findFirst({
      where: { id: perguntaId, pesquisaId },
      select: { id: true },
    });

    if (!pergunta) {
      return NextResponse.json({ message: "Pergunta não encontrada." }, { status: 404 });
    }

    await prisma.pergunta.delete({ where: { id: perguntaId } });
    return NextResponse.json({ message: "Pergunta removida com sucesso." }, { status: 200 });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao remover pergunta.",
      statusRules: [
        { includes: "Pesquisa não encontrada", status: 404 },
        { includes: "Pergunta não encontrada", status: 404 },
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
      ],
    });
  }
}

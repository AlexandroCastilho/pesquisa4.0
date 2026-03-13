import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManagePesquisa } from "@/lib/auth-context";
import { perguntaSchema } from "@/lib/validation/pesquisa";
import { getPrismaClient } from "@/lib/prisma";
import { buscarPesquisa } from "@/services/pesquisa.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();

    const { id } = await params;
    const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    return NextResponse.json({ perguntas: pesquisa.perguntas });
  } catch (error) {
    return createErrorResponse({
      error,
      message: "Falha ao listar perguntas.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "sem empresa", status: 403 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
      ],
    });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManagePesquisa(ctx.profile);

    const { id } = await params;
    const pesquisa = await buscarPesquisa(id, ctx.empresa.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    const body = await request.json();
    const data = perguntaSchema.parse(body);

    const prisma = getPrismaClient();
    const pergunta = await prisma.pergunta.create({
      data: {
        pesquisaId: id,
        texto: data.texto,
        tipo: data.tipo,
        ordem: data.ordem ?? 0,
        opcoes: data.opcoes
          ? {
              create: data.opcoes.map((o, idx) => ({
                texto: o.texto,
                ordem: o.ordem ?? idx,
              })),
            }
          : undefined,
      },
      include: { opcoes: { orderBy: { ordem: "asc" } } },
    });

    return NextResponse.json({ pergunta }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao criar pergunta.",
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

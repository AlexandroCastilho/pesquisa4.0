import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { perguntaSchema } from "@/lib/validation/pesquisa";
import { getPrismaClient } from "@/lib/prisma";
import { buscarPesquisa } from "@/services/pesquisa.service";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    const pesquisa = await buscarPesquisa(id, user.id);
    if (!pesquisa) return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });

    return NextResponse.json({ perguntas: pesquisa.perguntas });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao listar perguntas." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    const pesquisa = await buscarPesquisa(id, user.id);
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
    return createErrorResponse({ error, message: "Falha ao criar pergunta." });
  }
}

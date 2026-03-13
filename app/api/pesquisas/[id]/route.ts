import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { pesquisaSchema } from "@/lib/validation/pesquisa";
import { buscarPesquisa, atualizarPesquisa, deletarPesquisa } from "@/services/pesquisa.service";

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

    return NextResponse.json({ pesquisa });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao buscar pesquisa." });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const data = pesquisaSchema.parse(body);

    await atualizarPesquisa(id, user.id, data);
    return NextResponse.json({ message: "Pesquisa atualizada." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({ error, message: "Falha ao atualizar pesquisa." });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    await deletarPesquisa(id, user.id);
    return NextResponse.json({ message: "Pesquisa deletada." });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao deletar pesquisa." });
  }
}

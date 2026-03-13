import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { pesquisaSchema } from "@/lib/validation/pesquisa";
import { listarPesquisas, criarPesquisa } from "@/services/pesquisa.service";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const pesquisas = await listarPesquisas(user.id);
    return NextResponse.json({ pesquisas });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao listar pesquisas." });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const body = await request.json();
    const data = pesquisaSchema.parse(body);

    const pesquisa = await criarPesquisa(user.id, data);
    return NextResponse.json({ pesquisa }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({ error, message: "Falha ao criar pesquisa." });
  }
}

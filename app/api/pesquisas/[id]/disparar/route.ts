import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { disparoSchema } from "@/lib/validation/pesquisa";
import { dispararPesquisa } from "@/services/envio.service";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const data = disparoSchema.parse(body);

    const resultados = await dispararPesquisa(id, user.id, data);
    return NextResponse.json({ resultados }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao disparar pesquisa.",
      statusRules: [{ includes: "não encontrada", status: 404 }],
    });
  }
}

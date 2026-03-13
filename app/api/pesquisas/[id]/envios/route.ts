import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { listarEnvios } from "@/services/envio.service";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });

    const { id } = await params;
    const envios = await listarEnvios(id, user.id);

    if (!envios) {
      return NextResponse.json({ message: "Pesquisa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ envios }, { status: 200 });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao listar envios." });
  }
}

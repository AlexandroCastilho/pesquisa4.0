import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { respostaSchema } from "@/lib/validation/pesquisa";
import { buscarEnvioPorToken, registrarResposta } from "@/services/resposta.service";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const envio = await buscarEnvioPorToken(token);

    if (!envio) {
      return NextResponse.json({ message: "Link inválido." }, { status: 404 });
    }

    if (envio.resposta) {
      return NextResponse.json({ message: "Esta pesquisa já foi respondida." }, { status: 409 });
    }

    if (envio.expiraEm && envio.expiraEm < new Date()) {
      return NextResponse.json({ message: "Este link expirou." }, { status: 410 });
    }

    return NextResponse.json({
      pesquisa: envio.pesquisa,
      envio: { id: envio.id, nome: envio.nome, email: envio.email },
    });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao carregar pesquisa." });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const data = respostaSchema.parse(body);

    await registrarResposta(token, data);
    return NextResponse.json({ message: "Resposta registrada com sucesso." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({
      error,
      message: "Falha ao registrar resposta.",
      statusRules: [
        { includes: "já foi respondida", status: 409 },
        { includes: "expirou", status: 410 },
        { includes: "inválido", status: 404 },
      ],
    });
  }
}

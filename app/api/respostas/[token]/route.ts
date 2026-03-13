import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { respostaSchema } from "@/lib/validation/pesquisa";
import {
  buscarEnvioPorToken,
  marcarEnvioComoExpiradoSeNecessario,
  registrarResposta,
  validarEstadoEnvioParaResposta,
} from "@/services/resposta.service";
import { RESPOSTA_ERROS } from "@/services/resposta-validation.service";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const envio = await buscarEnvioPorToken(token);

    if (!envio) {
      return NextResponse.json({ message: RESPOSTA_ERROS.TOKEN_INVALIDO }, { status: 404 });
    }

    if (envio.expiraEm && envio.expiraEm < new Date()) {
      await marcarEnvioComoExpiradoSeNecessario(envio.id);
      return NextResponse.json({ message: RESPOSTA_ERROS.TOKEN_EXPIRADO }, { status: 410 });
    }

    try {
      validarEstadoEnvioParaResposta({
        id: envio.id,
        status: envio.status,
        expiraEm: envio.expiraEm,
        resposta: envio.resposta,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erro desconhecido.";
      if (detail.includes(RESPOSTA_ERROS.PESQUISA_JA_RESPONDIDA)) {
        return NextResponse.json({ message: RESPOSTA_ERROS.PESQUISA_JA_RESPONDIDA }, { status: 409 });
      }
      if (detail.includes(RESPOSTA_ERROS.TOKEN_EXPIRADO)) {
        return NextResponse.json({ message: RESPOSTA_ERROS.TOKEN_EXPIRADO }, { status: 410 });
      }
      throw error;
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
        { includes: RESPOSTA_ERROS.PESQUISA_JA_RESPONDIDA, status: 409 },
        { includes: RESPOSTA_ERROS.TOKEN_EXPIRADO, status: 410 },
        { includes: RESPOSTA_ERROS.TOKEN_INVALIDO, status: 404 },
        { includes: RESPOSTA_ERROS.DADOS_INCONSISTENTES, status: 422 },
      ],
    });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { forgotPasswordSchema } from "@/lib/validation/auth";

function mapForgotPasswordError(detail: string) {
  const normalized = detail.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("security purposes")) {
    return {
      status: 429,
      message: "Muitas tentativas em pouco tempo.",
      detail: "Aguarde alguns minutos e tente novamente.",
    };
  }

  if (normalized.includes("redirect") || normalized.includes("redirect_to")) {
    return {
      status: 400,
      message: "Não foi possível enviar o e-mail de recuperação.",
      detail: "A URL de redirecionamento não está autorizada no Supabase Auth.",
    };
  }

  return {
    status: 400,
    message: "Não foi possível enviar o e-mail de recuperação.",
    detail,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
    const requestOrigin = new URL(request.url).origin;
    const redirectBaseUrl = appUrl ?? forwardedOrigin ?? requestOrigin;

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBaseUrl}/callback?next=/redefinir-senha`,
    });

    if (error) {
      const mapped = mapForgotPasswordError(error.message);
      return NextResponse.json(
        {
          message: mapped.message,
          detail: mapped.detail,
        },
        { status: mapped.status }
      );
    }

    return NextResponse.json(
      {
        message:
          "Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }

    return createErrorResponse({
      error,
      message: "Falha ao solicitar redefinição de senha.",
    });
  }
}

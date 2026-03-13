import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { cadastroSchema } from "@/lib/validation/auth";
import { ensureTenantBootstrap } from "@/lib/auth/tenant-bootstrap.service";

function mapSignupError(detail: string) {
  const normalized = detail.toLowerCase();

  if (normalized.includes("redirect") || normalized.includes("redirect_to")) {
    return {
      status: 400,
      message: "Não foi possível criar a conta.",
      detail: "A URL de redirecionamento não está autorizada no Supabase Auth.",
    };
  }

  if (normalized.includes("fetch failed") || normalized.includes("network")) {
    return {
      status: 503,
      message: "Falha de conexão com o serviço de autenticação.",
      detail:
        "Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no deploy da Vercel.",
    };
  }

  return {
    status: 400,
    message: "Não foi possível criar a conta.",
    detail,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, email, password } = cadastroSchema.parse(body);

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
    const requestOrigin = new URL(request.url).origin;

    // Em produção, se NEXT_PUBLIC_APP_URL estiver local, prioriza origem real da requisição.
    const appUrlInvalidaEmProd =
      process.env.NODE_ENV === "production" &&
      Boolean(appUrl && /localhost|127\.0\.0\.1/i.test(appUrl));

    const redirectBaseUrl = appUrlInvalidaEmProd
      ? (forwardedOrigin ?? requestOrigin)
      : (appUrl ?? forwardedOrigin ?? requestOrigin);

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, company },
        emailRedirectTo: `${redirectBaseUrl}/callback`,
      },
    });

    if (error) {
      const mapped = mapSignupError(error.message);
      return NextResponse.json(
        { message: mapped.message, detail: mapped.detail },
        { status: mapped.status }
      );
    }

    if (data.user) {
      await ensureTenantBootstrap({
        user: data.user,
        preferredName: name,
        preferredCompany: company,
      });
    }

    return NextResponse.json(
      { message: "Conta criada! Verifique seu e-mail para confirmar o acesso." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }

    return createErrorResponse({
      error,
      message: "Falha ao criar conta.",
      statusRules: [
        { includes: "SUPABASE_ENV_MISSING", status: 503 },
        { includes: "SUPABASE_URL_INVALID", status: 503 },
        { includes: "fetch failed", status: 503 },
      ],
    });
  }
}
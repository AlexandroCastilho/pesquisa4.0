import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { loginSchema } from "@/lib/validation/auth";
import { getPrismaClient } from "@/lib/prisma";
import { z } from "zod";

function mapLoginError(detail: string) {
  const normalized = detail.toLowerCase();

  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) {
    return {
      status: 401,
      message: "Confirme seu e-mail antes de entrar.",
      detail: "Verifique sua caixa de entrada e clique no link de confirmação.",
    };
  }

  if (normalized.includes("invalid login credentials")) {
    return {
      status: 401,
      message: "E-mail ou senha inválidos.",
      detail: "Confira os dados e tente novamente.",
    };
  }

  return {
    status: 401,
    message: "Não foi possível realizar o login.",
    detail,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const mapped = mapLoginError(error.message);
      return NextResponse.json(
        { message: mapped.message, detail: mapped.detail },
        { status: mapped.status }
      );
    }

    // Garante que o perfil existe no banco (criado no primeiro login)
    if (data.user) {
      const prisma = getPrismaClient();
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          name: data.user.user_metadata?.name ?? null,
          company: data.user.user_metadata?.company ?? null,
        },
      });
    }

    return NextResponse.json({ message: "Login realizado com sucesso." }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }
    return createErrorResponse({ error, message: "Falha ao fazer login." });
  }
}

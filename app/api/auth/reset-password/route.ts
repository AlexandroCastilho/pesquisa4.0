import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = resetPasswordSchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "Sessão de redefinição inválida.",
          detail: "Abra novamente o link de recuperação enviado por e-mail.",
        },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json(
        {
          message: "Não foi possível redefinir a senha.",
          detail: error.message,
        },
        { status: 400 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json(
      {
        message: "Senha atualizada com sucesso. Faça login com a nova senha.",
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
      message: "Falha ao redefinir senha.",
    });
  }
}

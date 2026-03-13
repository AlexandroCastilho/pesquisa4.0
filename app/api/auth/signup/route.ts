import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";
import { cadastroSchema } from "@/lib/validation/auth";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, email, password } = cadastroSchema.parse(body);

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
    const requestOrigin = new URL(request.url).origin;
    const redirectBaseUrl = appUrl ?? forwardedOrigin ?? requestOrigin;

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
      return NextResponse.json(
        { message: "Não foi possível criar a conta.", detail: error.message },
        { status: 400 }
      );
    }

    if (data.user) {
      const authUser = data.user;
      const prisma = getPrismaClient();
      const baseSlug = company
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      await prisma.$transaction(async (tx) => {
        const empresa = await tx.empresa.create({
          data: {
            nome: company,
            slug: `${baseSlug || "empresa"}-${authUser.id.slice(0, 6)}`,
          },
        });

        await tx.profile.upsert({
          where: { id: authUser.id },
          update: {
            name,
            company,
            empresaId: empresa.id,
            role: "OWNER",
            ativo: true,
          },
          create: {
            id: authUser.id,
            name,
            company,
            empresaId: empresa.id,
            role: "OWNER",
            ativo: true,
          },
        });
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
    });
  }
}
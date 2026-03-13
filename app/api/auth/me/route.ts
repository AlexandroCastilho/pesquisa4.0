import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name ?? user.user_metadata?.name ?? null,
      company: profile?.empresa?.nome ?? profile?.company ?? user.user_metadata?.company ?? null,
      role: profile?.role ?? null,
      ativo: profile?.ativo ?? true,
      empresaId: profile?.empresaId ?? null,
    },
  });
}

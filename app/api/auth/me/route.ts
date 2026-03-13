import { NextResponse } from "next/server";
import { getAuthTenantContext } from "@/lib/auth-context";

export async function GET() {
  const ctx = await getAuthTenantContext();

  if (!ctx) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.profile.name,
      company: ctx.empresa.nome,
      role: ctx.profile.role,
      ativo: ctx.profile.ativo,
      empresaId: ctx.profile.empresaId,
    },
  });
}

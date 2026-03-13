import { NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse } from "@/lib/api-error";
import { requireAdminTenantContext, assertCanManageUsers } from "@/lib/auth-context";
import { updateUserAccessSchema } from "@/lib/validation/admin-user";
import { atualizarAcessoUsuario } from "@/services/admin/admin-user-access.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireAdminTenantContext();
    assertCanManageUsers(ctx.profile);

    const { id } = await params;
    const body = await request.json();
    const data = updateUserAccessSchema.parse(body);

    const usuario = await atualizarAcessoUsuario({
      actor: {
        id: ctx.profile.id,
        role: ctx.profile.role,
        empresaId: ctx.empresa.id,
      },
      targetUserId: id,
      role: data.role,
      ativo: data.ativo,
    });

    return NextResponse.json({ usuario, message: "Acesso do usuário atualizado." }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.issues.map((issue) => issue.message).join(" ");
      return NextResponse.json({ message: "Dados inválidos.", detail }, { status: 400 });
    }

    return createErrorResponse({
      error,
      message: "Falha ao atualizar usuário.",
      statusRules: [
        { includes: "Sessão inválida", status: 401 },
        { includes: "desativada", status: 403 },
        { includes: "Acesso negado", status: 403 },
        { includes: "não tem permissão", status: 403 },
        { includes: "não encontrado", status: 404 },
        { includes: "último OWNER", status: 409 },
        { includes: "própria conta", status: 409 },
        { includes: "alterar o papel da própria conta", status: 409 },
        { includes: "Apenas um OWNER", status: 403 },
      ],
    });
  }
}
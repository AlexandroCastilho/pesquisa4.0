import { getPrismaClient } from "@/lib/prisma";
import { sendEmail, buildPesquisaEmailHtml } from "@/services/email.service";
import type { DisparoInput } from "@/lib/validation/pesquisa";

export async function listarEnvios(pesquisaId: string, profileId: string) {
  const prisma = getPrismaClient();

  // Garante que a pesquisa pertence ao perfil
  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, profileId },
    select: { id: true },
  });

  if (!pesquisa) return null;

  return prisma.envio.findMany({
    where: { pesquisaId },
    orderBy: { criadoEm: "desc" },
  });
}

export async function dispararPesquisa(
  pesquisaId: string,
  profileId: string,
  input: DisparoInput
) {
  const prisma = getPrismaClient();
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const appUrl = rawAppUrl.trim().replace(/\/+$/, "");

  if (appUrl.includes("/callback")) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL está incorreta. Use apenas a raiz do sistema, sem /callback."
    );
  }

  if (appUrl.includes(".github.dev") && !appUrl.includes(".app.github.dev")) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL está incorreta. No Codespaces, use a URL pública da aplicação, como https://<nome>-3000.app.github.dev."
    );
  }

  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, profileId },
    select: { id: true, titulo: true },
  });

  if (!pesquisa) {
    throw new Error("Pesquisa não encontrada.");
  }

  const expiraEm = new Date(
    Date.now() + (input.expiraDias ?? 7) * 24 * 60 * 60 * 1000
  );

  const resultados: Array<{ email: string; status: "ENVIADO" | "ERRO"; erroMsg?: string }> = [];

  for (const dest of input.destinatarios) {
    const envio = await prisma.envio.create({
      data: {
        pesquisaId,
        nome: dest.nome,
        email: dest.email,
        expiraEm,
        status: "PENDENTE",
      },
    });

    const link = `${appUrl}/responder/${envio.token}`;
    const { subject, html, text } = buildPesquisaEmailHtml({
      destinatarioNome: dest.nome,
      pesquisaTitulo: pesquisa.titulo,
      link,
    });

    try {
      await sendEmail({ to: dest.email, toName: dest.nome, subject, html, text });

      await prisma.envio.update({
        where: { id: envio.id },
        data: { status: "ENVIADO", enviadoEm: new Date() },
      });

      resultados.push({ email: dest.email, status: "ENVIADO" });
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : "erro desconhecido";

      await prisma.envio.update({
        where: { id: envio.id },
        data: { status: "ERRO", erroMsg },
      });

      resultados.push({ email: dest.email, status: "ERRO", erroMsg });
    }
  }

  return resultados;
}

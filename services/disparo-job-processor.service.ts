import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";
import { buildPesquisaEmailHtml, sendEmail } from "@/services/email.service";
import {
  calcularProgressoJob,
  getAppUrlBase,
  getPesquisaDoTenant,
  MAX_TENTATIVAS_ENVIO,
} from "@/services/envio.service";

const JOB_LOCK_TTL_MS = 90_000;
const ENVIO_PROCESSING_TTL_MS = 120_000;
const RETRY_BACKOFF_MS = [60_000, 300_000, 900_000] as const;

function getPrismaCompat() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getPrismaClient() as any;
}

function classificarErroEnvio(error: unknown) {
  const detail = error instanceof Error ? error.message : "erro desconhecido";
  const normalized = detail.toLowerCase();

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return { codigo: "EMAIL_TIMEOUT", detail };
  }

  if (normalized.includes("rate") && normalized.includes("limit")) {
    return { codigo: "EMAIL_RATE_LIMIT", detail };
  }

  if (normalized.includes("invalid") && normalized.includes("email")) {
    return { codigo: "EMAIL_INVALID", detail };
  }

  return { codigo: "EMAIL_PROVIDER_ERROR", detail };
}

function proximoRetryParaTentativa(tentativas: number) {
  if (tentativas >= MAX_TENTATIVAS_ENVIO) return null;
  const idx = Math.max(0, Math.min(tentativas - 1, RETRY_BACKOFF_MS.length - 1));
  return new Date(Date.now() + RETRY_BACKOFF_MS[idx]);
}

async function adquirirLockDoJob(
  pesquisaId: string,
  jobId: string,
  empresaId: string,
  lockToken: string
) {
  const prisma = getPrismaCompat();
  const now = new Date();
  const staleBefore = new Date(Date.now() - JOB_LOCK_TTL_MS);

  const lockAcquired = await prisma.disparoJob.updateMany({
    where: {
      id: jobId,
      pesquisaId,
      empresaId,
      status: { in: ["PENDENTE", "PROCESSANDO"] },
      OR: [{ lockAt: null }, { lockAt: { lt: staleBefore } }],
    },
    data: {
      status: "PROCESSANDO",
      lockToken,
      lockAt: now,
    },
  });

  return lockAcquired.count > 0;
}

async function renovarLockDoJob(jobId: string, lockToken: string) {
  const prisma = getPrismaCompat();
  await prisma.disparoJob.updateMany({
    where: { id: jobId, lockToken },
    data: { lockAt: new Date() },
  });
}

async function liberarLockDoJob(jobId: string, lockToken: string) {
  const prisma = getPrismaCompat();
  await prisma.disparoJob.updateMany({
    where: { id: jobId, lockToken },
    data: { lockAt: null, lockToken: null },
  });
}

async function reencaminharEnviosTravados(jobId: string) {
  const prisma = getPrismaCompat();
  const staleBefore = new Date(Date.now() - ENVIO_PROCESSING_TTL_MS);

  await prisma.envio.updateMany({
    where: {
      jobId,
      status: "PROCESSANDO",
      OR: [
        { ultimaTentativaEm: null },
        { ultimaTentativaEm: { lt: staleBefore } },
      ],
    },
    data: {
      status: "PENDENTE",
      proximoRetryEm: new Date(),
      erroCodigo: "PROCESSAMENTO_INTERROMPIDO",
      erroMsg: "Envio retomado após interrupção.",
    },
  });
}

export async function processarDisparoJob(
  pesquisaId: string,
  jobId: string,
  empresaId: string,
  batchSize = 10
) {
  const prisma = getPrismaCompat();
  const appUrl = getAppUrlBase();

  const job = await prisma.disparoJob.findFirst({
    where: { id: jobId, pesquisaId, empresaId },
    select: {
      id: true,
      status: true,
      pesquisa: { select: { titulo: true } },
    },
  });

  if (!job) {
    throw new Error("Lote de disparo não encontrado.");
  }

  if (job.status === "CONCLUIDO" || job.status === "ERRO") {
    return calcularProgressoJob(jobId);
  }

  const lockToken = randomUUID();
  const lockAcquired = await adquirirLockDoJob(pesquisaId, jobId, empresaId, lockToken);

  if (!lockAcquired) {
    return calcularProgressoJob(jobId);
  }

  try {
    await prisma.disparoJob.updateMany({
      where: { id: jobId, iniciadoEm: null },
      data: { iniciadoEm: new Date() },
    });

    await reencaminharEnviosTravados(jobId);

    const now = new Date();
    const elegiveis = await prisma.envio.findMany({
      where: {
        jobId,
        OR: [
          { status: "PENDENTE" },
          {
            status: "ERRO",
            tentativas: { lt: MAX_TENTATIVAS_ENVIO },
            OR: [{ proximoRetryEm: null }, { proximoRetryEm: { lte: now } }],
          },
        ],
      },
      orderBy: [{ proximoRetryEm: "asc" }, { criadoEm: "asc" }],
      take: batchSize,
      select: {
        id: true,
        nome: true,
        email: true,
        token: true,
      },
    });

    for (const envio of elegiveis) {
      const claimedAt = new Date();
      const claimed = await prisma.envio.updateMany({
        where: {
          id: envio.id,
          jobId,
          OR: [
            { status: "PENDENTE" },
            {
              status: "ERRO",
              tentativas: { lt: MAX_TENTATIVAS_ENVIO },
              OR: [{ proximoRetryEm: null }, { proximoRetryEm: { lte: claimedAt } }],
            },
          ],
        },
        data: {
          status: "PROCESSANDO",
          ultimaTentativaEm: claimedAt,
          proximoRetryEm: null,
          tentativas: { increment: 1 },
        },
      });

      if (claimed.count === 0) {
        continue;
      }

      const envioAtual = await prisma.envio.findUnique({
        where: { id: envio.id },
        select: { tentativas: true },
      });

      if (!envioAtual) {
        continue;
      }

      const link = `${appUrl}/responder/${envio.token}`;
      const { subject, html, text } = buildPesquisaEmailHtml({
        destinatarioNome: envio.nome,
        pesquisaTitulo: job.pesquisa.titulo,
        link,
      });

      try {
        await sendEmail({
          to: envio.email,
          toName: envio.nome,
          subject,
          html,
          text,
        });

        await prisma.envio.update({
          where: { id: envio.id },
          data: {
            status: "ENVIADO",
            enviadoEm: new Date(),
            erroCodigo: null,
            erroMsg: null,
            proximoRetryEm: null,
          },
        });
      } catch (error) {
        const erro = classificarErroEnvio(error);
        const proximoRetryEm = proximoRetryParaTentativa(envioAtual.tentativas);

        await prisma.envio.update({
          where: { id: envio.id },
          data: {
            status: "ERRO",
            erroCodigo: erro.codigo,
            erroMsg: erro.detail,
            proximoRetryEm,
          },
        });

        await prisma.disparoJob.update({
          where: { id: jobId },
          data: { ultimoErro: `${erro.codigo}: ${erro.detail}` },
        });
      }

      await renovarLockDoJob(jobId, lockToken);
    }
  } finally {
    await liberarLockDoJob(jobId, lockToken);
  }

  return calcularProgressoJob(jobId);
}

export async function acionarProcessamentoDisparo(
  pesquisaId: string,
  jobId: string,
  empresaId: string,
  options?: { ciclos?: number; batchSize?: number }
) {
  await getPesquisaDoTenant(pesquisaId, empresaId);

  const ciclos = Math.max(1, Math.min(5, options?.ciclos ?? 1));
  const batchSize = Math.max(1, Math.min(50, options?.batchSize ?? 10));

  let progresso = await calcularProgressoJob(jobId);

  for (let i = 0; i < ciclos; i += 1) {
    if (!progresso.emAndamento) break;
    if (progresso.retriesPendentes > 0 && progresso.retriesProntos === 0 && progresso.pendentes === 0) {
      break;
    }

    progresso = await processarDisparoJob(pesquisaId, jobId, empresaId, batchSize);
  }

  return progresso;
}

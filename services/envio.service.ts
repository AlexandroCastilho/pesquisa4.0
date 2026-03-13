import { getPrismaClient } from "@/lib/prisma";
import type { DisparoInput } from "@/lib/validation/pesquisa";

export const MAX_TENTATIVAS_ENVIO = 3;

export type JobResumo = {
  id: string;
  status: "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";
  total: number;
  processados: number;
  enviados: number;
  erros: number;
  criadoEm: Date;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
  ultimoErro: string | null;
  lockAt: Date | null;
};

export type JobProgresso = JobResumo & {
  pendentes: number;
  emProcessamento: number;
  retriesPendentes: number;
  retriesProntos: number;
  percentual: number;
  emAndamento: boolean;
  proximoRetryEm: Date | null;
};

function getPrismaCompat() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getPrismaClient() as any;
}

export async function listarEnvios(pesquisaId: string, empresaId: string) {
  const prisma = getPrismaCompat();

  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, empresaId },
    select: { id: true },
  });

  if (!pesquisa) return null;

  return prisma.envio.findMany({
    where: { pesquisaId },
    orderBy: { criadoEm: "desc" },
  });
}

export function getAppUrlBase() {
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

  return appUrl;
}

function normalizeDestinatarios(destinatarios: DisparoInput["destinatarios"]) {
  const uniqueByEmail = new Map<string, { nome: string; email: string }>();

  for (const dest of destinatarios) {
    const nome = dest.nome.trim();
    const email = dest.email.trim().toLowerCase();
    if (!nome || !email) continue;
    if (!uniqueByEmail.has(email)) {
      uniqueByEmail.set(email, { nome, email });
    }
  }

  return Array.from(uniqueByEmail.values());
}

export async function getPesquisaDoTenant(pesquisaId: string, empresaId: string) {
  const prisma = getPrismaCompat();
  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, empresaId },
    select: { id: true, titulo: true, empresaId: true },
  });

  if (!pesquisa) {
    throw new Error("Pesquisa não encontrada.");
  }

  return pesquisa;
}

async function getJobDoTenant(pesquisaId: string, jobId: string, empresaId: string) {
  const prisma = getPrismaCompat();
  const job = await prisma.disparoJob.findFirst({
    where: { id: jobId, pesquisaId, empresaId },
    select: { id: true },
  });

  if (!job) {
    throw new Error("Lote de disparo não encontrado.");
  }

  return job;
}

export async function calcularProgressoJob(jobId: string): Promise<JobProgresso> {
  const prisma = getPrismaCompat();
  const now = new Date();

  const [job, total, pendentes, emProcessamento, enviados, retriesPendentes, retriesProntos, errosFinais, minProximoRetry] =
    await Promise.all([
      prisma.disparoJob.findUnique({ where: { id: jobId } }),
      prisma.envio.count({ where: { jobId } }),
      prisma.envio.count({ where: { jobId, status: "PENDENTE" } }),
      prisma.envio.count({ where: { jobId, status: "PROCESSANDO" } }),
      prisma.envio.count({ where: { jobId, status: { in: ["ENVIADO", "RESPONDIDO", "EXPIRADO"] } } }),
      prisma.envio.count({
        where: {
          jobId,
          status: "ERRO",
          tentativas: { lt: MAX_TENTATIVAS_ENVIO },
          proximoRetryEm: { gt: now },
        },
      }),
      prisma.envio.count({
        where: {
          jobId,
          status: "ERRO",
          tentativas: { lt: MAX_TENTATIVAS_ENVIO },
          OR: [{ proximoRetryEm: null }, { proximoRetryEm: { lte: now } }],
        },
      }),
      prisma.envio.count({
        where: {
          jobId,
          status: "ERRO",
          OR: [
            { tentativas: { gte: MAX_TENTATIVAS_ENVIO } },
            {
              AND: [
                { tentativas: { lt: MAX_TENTATIVAS_ENVIO } },
                { proximoRetryEm: null },
              ],
            },
          ],
        },
      }),
      prisma.envio.aggregate({
        where: {
          jobId,
          status: "ERRO",
          tentativas: { lt: MAX_TENTATIVAS_ENVIO },
          proximoRetryEm: { gt: now },
        },
        _min: { proximoRetryEm: true },
      }),
    ]);

  if (!job) {
    throw new Error("Lote de disparo não encontrado.");
  }

  const processados = enviados + errosFinais;
  const trabalhoRestante = pendentes + emProcessamento + retriesPendentes + retriesProntos;
  const emAndamento = trabalhoRestante > 0;
  const percentual = total > 0 ? Math.round((processados / total) * 100) : 100;

  const status: JobResumo["status"] = emAndamento
    ? emProcessamento > 0
      ? "PROCESSANDO"
      : "PENDENTE"
    : enviados > 0
      ? "CONCLUIDO"
      : "ERRO";

  const updated = await prisma.disparoJob.update({
    where: { id: jobId },
    data: {
      status,
      total,
      processados,
      enviados,
      erros: errosFinais,
      finalizadoEm: emAndamento ? null : job.finalizadoEm ?? now,
      ...(emAndamento ? {} : { lockAt: null, lockToken: null }),
    },
    select: {
      id: true,
      status: true,
      total: true,
      processados: true,
      enviados: true,
      erros: true,
      criadoEm: true,
      iniciadoEm: true,
      finalizadoEm: true,
      ultimoErro: true,
      lockAt: true,
    },
  });

  return {
    ...updated,
    pendentes,
    emProcessamento,
    retriesPendentes,
    retriesProntos,
    percentual,
    emAndamento,
    proximoRetryEm: minProximoRetry._min.proximoRetryEm,
  };
}

export async function criarDisparoJob(
  pesquisaId: string,
  empresaId: string,
  input: DisparoInput
) {
  const prisma = getPrismaCompat();
  await getPesquisaDoTenant(pesquisaId, empresaId);

  const expiraEm = new Date(
    Date.now() + (input.expiraDias ?? 7) * 24 * 60 * 60 * 1000
  );
  const destinatariosUnicos = normalizeDestinatarios(input.destinatarios);

  const emails = destinatariosUnicos.map((d) => d.email);
  const jaAtivos = emails.length
    ? await prisma.envio.findMany({
        where: {
          pesquisaId,
          email: { in: emails },
          status: { in: ["PENDENTE", "PROCESSANDO", "ENVIADO", "RESPONDIDO"] },
        },
        select: { email: true },
      })
    : [];

  const bloqueados = new Set(
    (jaAtivos as Array<{ email: string }>).map((item: { email: string }) =>
      item.email.toLowerCase()
    )
  );
  const destinatariosParaCriar = destinatariosUnicos.filter(
    (dest) => !bloqueados.has(dest.email.toLowerCase())
  );

  const job = await prisma.disparoJob.create({
    data: {
      pesquisaId,
      empresaId,
      status: destinatariosParaCriar.length > 0 ? "PENDENTE" : "CONCLUIDO",
      total: destinatariosParaCriar.length,
      processados: 0,
      enviados: 0,
      erros: 0,
      finalizadoEm: destinatariosParaCriar.length > 0 ? null : new Date(),
    },
    select: {
      id: true,
      status: true,
      total: true,
      processados: true,
      enviados: true,
      erros: true,
      criadoEm: true,
      iniciadoEm: true,
      finalizadoEm: true,
      ultimoErro: true,
      lockAt: true,
    },
  });

  if (destinatariosParaCriar.length > 0) {
    await prisma.envio.createMany({
      data: destinatariosParaCriar.map((dest) => ({
        pesquisaId,
        jobId: job.id,
        nome: dest.nome,
        email: dest.email,
        expiraEm,
        status: "PENDENTE",
        tentativas: 0,
      })),
    });
  }

  return {
    job,
    totalSolicitados: input.destinatarios.length,
    totalUnicos: destinatariosUnicos.length,
    totalIgnoradosDuplicados: destinatariosUnicos.length - destinatariosParaCriar.length,
    totalPendentesCriados: destinatariosParaCriar.length,
  };
}

export async function obterProgressoDisparoJob(
  pesquisaId: string,
  jobId: string,
  empresaId: string
) {
  await getPesquisaDoTenant(pesquisaId, empresaId);
  await getJobDoTenant(pesquisaId, jobId, empresaId);
  return calcularProgressoJob(jobId);
}

export async function obterJobAtivoDaPesquisa(pesquisaId: string, empresaId: string) {
  const prisma = getPrismaCompat();
  await getPesquisaDoTenant(pesquisaId, empresaId);

  const job = await prisma.disparoJob.findFirst({
    where: {
      pesquisaId,
      empresaId,
      status: { in: ["PENDENTE", "PROCESSANDO"] },
    },
    orderBy: { criadoEm: "desc" },
    select: { id: true },
  });

  if (!job) return null;
  return calcularProgressoJob(job.id);
}

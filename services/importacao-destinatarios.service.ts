import { getPrismaClient } from "@/lib/prisma";
import type { ImportacaoDestinatariosInput } from "@/lib/validation/pesquisa";
import type {
  DestinatarioImportado,
  FormatoImportacaoDestinatarios,
  ImportacaoDestinatariosLote,
  RejeicaoImportacao,
  ResumoImportacao,
} from "@/types/importacao-destinatarios";

const HEADER_ALIASES = {
  nome: ["nome", "cliente", "razaosocial", "razao social"],
  email: ["email", "e-mail", "emailprincipal", "email principal"],
} as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string, separator: "," | ";") {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === separator) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function inferSeparator(headerLine: string): "," | ";" {
  return headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map((alias) => normalizeHeader(alias));
  return headers.findIndex((h) => normalizedAliases.includes(h));
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toRejeicoesArray(value: unknown): RejeicaoImportacao[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const linha = Number((item as { linha?: unknown }).linha);
      const motivo = (item as { motivo?: unknown }).motivo;
      const valor = (item as { valor?: unknown }).valor;

      if (!Number.isFinite(linha) || typeof motivo !== "string" || typeof valor !== "string") {
        return null;
      }

      return { linha, motivo, valor } as RejeicaoImportacao;
    })
    .filter((item): item is RejeicaoImportacao => item !== null);
}

function parseCsvDestinatarios(conteudo: string) {
  const lines = conteudo
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Arquivo vazio.");
  }

  const separator = inferSeparator(lines[0]);
  const headers = parseCsvLine(lines[0], separator).map(normalizeHeader);

  const nomeIndex = findHeaderIndex(headers, [...HEADER_ALIASES.nome]);
  const emailIndex = findHeaderIndex(headers, [...HEADER_ALIASES.email]);

  if (nomeIndex < 0 || emailIndex < 0) {
    throw new Error(
      "Cabeçalho inválido. Use colunas equivalentes a nome/cliente/razao social e email/e-mail/email principal."
    );
  }

  const destinatarios: DestinatarioImportado[] = [];
  const rejeicoes: RejeicaoImportacao[] = [];
  const seenEmails = new Set<string>();
  let duplicados = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i], separator);
    const nome = (cols[nomeIndex] ?? "").trim();
    const email = (cols[emailIndex] ?? "").trim().toLowerCase();

    if (!nome) {
      rejeicoes.push({ linha: i + 1, motivo: "NOME_AUSENTE", valor: lines[i] });
      continue;
    }

    if (!email) {
      rejeicoes.push({ linha: i + 1, motivo: "EMAIL_AUSENTE", valor: lines[i] });
      continue;
    }

    if (!validarEmail(email)) {
      rejeicoes.push({ linha: i + 1, motivo: "EMAIL_INVALIDO", valor: email });
      continue;
    }

    if (seenEmails.has(email)) {
      duplicados += 1;
      rejeicoes.push({ linha: i + 1, motivo: "EMAIL_DUPLICADO_ARQUIVO", valor: email });
      continue;
    }

    seenEmails.add(email);
    destinatarios.push({ nome, email });
  }

  const totalRegistros = Math.max(0, lines.length - 1);
  const resumo: ResumoImportacao = {
    total: totalRegistros,
    validos: destinatarios.length,
    invalidos: rejeicoes.length,
    duplicados,
    rejeicoes,
  };

  return { destinatarios, resumo };
}

type ParseStrategy = (
  conteudo: string
) => { destinatarios: DestinatarioImportado[]; resumo: ResumoImportacao };

const parseStrategies: Record<FormatoImportacaoDestinatarios, ParseStrategy> = {
  CSV_SIMPLE: parseCsvDestinatarios,
  CSV_ERP: parseCsvDestinatarios,
  XLSX: () => {
    throw new Error("Formato XLSX ainda não suportado. Use CSV por enquanto.");
  },
};

function getPrismaCompat() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getPrismaClient() as any;
}

async function registrarLoteImportacao({
  pesquisaId,
  empresaId,
  profileId,
  formato,
  nomeArquivo,
  resumo,
}: {
  pesquisaId: string;
  empresaId: string;
  profileId: string;
  formato: FormatoImportacaoDestinatarios;
  nomeArquivo?: string;
  resumo: ResumoImportacao;
}) {
  const prisma = getPrismaCompat();

  const lote = await prisma.importacaoDestinatariosLote.create({
    data: {
      pesquisaId,
      empresaId,
      profileId,
      formato,
      nomeArquivo: nomeArquivo ?? null,
      totalLinhas: resumo.total,
      validos: resumo.validos,
      invalidos: resumo.invalidos,
      duplicados: resumo.duplicados,
      rejeicoes: resumo.rejeicoes,
    },
    select: {
      id: true,
      formato: true,
      nomeArquivo: true,
      totalLinhas: true,
      validos: true,
      invalidos: true,
      duplicados: true,
      criadaEm: true,
      profileId: true,
      rejeicoes: true,
    },
  });

  return {
    ...lote,
    rejeicoes: toRejeicoesArray(lote.rejeicoes),
  };
}

export async function importarDestinatariosPorArquivo({
  pesquisaId,
  empresaId,
  profileId,
  input,
}: {
  pesquisaId: string;
  empresaId: string;
  profileId: string;
  input: ImportacaoDestinatariosInput;
}) {
  const prisma = getPrismaCompat();

  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, empresaId },
    select: { id: true },
  });

  if (!pesquisa) {
    throw new Error("Pesquisa não encontrada.");
  }

  const parse = parseStrategies[input.formato as FormatoImportacaoDestinatarios];
  if (!parse) {
    throw new Error("Formato de importação não suportado.");
  }

  const parsed = parse(input.conteudo);

  let lote: ImportacaoDestinatariosLote | null = null;
  if (input.acao === "IMPORTAR") {
    lote = await registrarLoteImportacao({
      pesquisaId,
      empresaId,
      profileId,
      formato: input.formato,
      nomeArquivo: input.nomeArquivo,
      resumo: parsed.resumo,
    });
  }

  return {
    destinatarios: parsed.destinatarios,
    resumo: parsed.resumo,
    lote,
  };
}

export async function listarImportacoesDestinatarios(
  pesquisaId: string,
  empresaId: string
): Promise<ImportacaoDestinatariosLote[]> {
  const prisma = getPrismaCompat();

  const pesquisa = await prisma.pesquisa.findFirst({
    where: { id: pesquisaId, empresaId },
    select: { id: true },
  });

  if (!pesquisa) {
    throw new Error("Pesquisa não encontrada.");
  }

  const lotes = await prisma.importacaoDestinatariosLote.findMany({
    where: { pesquisaId, empresaId },
    orderBy: { criadaEm: "desc" },
    take: 20,
    select: {
      id: true,
      formato: true,
      nomeArquivo: true,
      totalLinhas: true,
      validos: true,
      invalidos: true,
      duplicados: true,
      criadaEm: true,
      profileId: true,
      rejeicoes: true,
    },
  });

  return (lotes as Array<ImportacaoDestinatariosLote>).map((lote: ImportacaoDestinatariosLote) => ({
    ...lote,
    rejeicoes: toRejeicoesArray(lote.rejeicoes),
  }));
}

export function gerarModeloOficialCsv() {
  return "nome,email\nJoão Silva,joao@email.com\nEmpresa Exemplo LTDA,contato@empresa.com\n";
}

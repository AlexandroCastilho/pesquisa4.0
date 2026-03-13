import nodemailer from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

const SMTP_TIMEOUT_MS = 10_000;

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey: string | null = null;

function parseSmtpSecure(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const portRaw = process.env.SMTP_PORT?.trim() ?? "";
  const secureRaw = process.env.SMTP_SECURE?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!portRaw) missing.push("SMTP_PORT");
  if (!secureRaw) missing.push("SMTP_SECURE");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!from) missing.push("EMAIL_FROM");

  if (missing.length > 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] SMTP não configurado. Variáveis ausentes: ${missing.join(", ")}.`);
      return null;
    }
    throw new Error(`Serviço de e-mail SMTP não configurado. Defina: ${missing.join(", ")}.`);
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT inválido. Use um número inteiro positivo.");
  }

  return { host, port, secure: parseSmtpSecure(secureRaw), user, pass, from };
}

function getTransporter(config: SmtpConfig): nodemailer.Transporter {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;

  if (!cachedTransporter || cachedTransporterKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
      auth: { user: config.user, pass: config.pass },
    });
    cachedTransporterKey = key;
  }

  return cachedTransporter;
}

export type SendEmailInput = {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  usedDevFallback: boolean;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getSmtpConfig();

  if (!config) {
    console.info(`[email] DEV — e-mail para ${input.to}: ${input.subject}`);
    return { usedDevFallback: true };
  }

  try {
    const transporter = getTransporter(config);

    await Promise.race([
      transporter.sendMail({
        from: config.from,
        to: `${input.toName} <${input.to}>`,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Tempo limite excedido ao enviar e-mail SMTP.")),
          SMTP_TIMEOUT_MS
        )
      ),
    ]);

    console.info(`[email] Enviado com sucesso para ${input.to}.`);
    return { usedDevFallback: false };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro desconhecido";
    console.error(`[email] Falha no envio SMTP para ${input.to}: ${detail}`);

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] Usando fallback de desenvolvimento para ${input.to}.`);
      return { usedDevFallback: true };
    }

    throw new Error("Falha no envio de e-mail via SMTP.");
  }
}

export function buildPesquisaEmailHtml(params: {
  destinatarioNome: string;
  pesquisaTitulo: string;
  link: string;
}): { subject: string; html: string; text: string } {
  const subject = `Você foi convidado para responder: ${params.pesquisaTitulo}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e293b;">Olá, ${params.destinatarioNome}!</h2>
      <p>Você foi convidado para responder a pesquisa: <strong>${params.pesquisaTitulo}</strong>.</p>
      <p>Clique no botão abaixo para acessar:</p>
      <a href="${params.link}"
         style="display:inline-block;background:#1e293b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Responder Pesquisa
      </a>
      <p style="margin-top:24px;color:#64748b;font-size:12px;">
        Se não conseguir clicar no botão, acesse: ${params.link}
      </p>
    </div>
  `;

  const text = `Olá, ${params.destinatarioNome}!\n\nVocê foi convidado para responder a pesquisa: ${params.pesquisaTitulo}.\n\nAcesse: ${params.link}`;

  return { subject, html, text };
}

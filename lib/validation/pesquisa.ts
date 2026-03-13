import { z } from "zod";

export const pesquisaSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório.").max(200),
  descricao: z.string().trim().max(1000).optional(),
  status: z.enum(["RASCUNHO", "ATIVA", "ENCERRADA"]).optional(),
});

export const perguntaSchema = z.object({
  texto: z.string().trim().min(1, "Texto da pergunta obrigatório."),
  tipo: z.enum(["MULTIPLA_ESCOLHA", "TEXTO_LIVRE", "ESCALA"]),
  ordem: z.number().int().min(0).optional(),
  opcoes: z
    .array(
      z.object({
        texto: z.string().trim().min(1),
        ordem: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

export const disparoSchema = z.object({
  destinatarios: z
    .array(
      z.object({
        nome: z.string().trim().min(1),
        email: z.string().email("E-mail inválido."),
      })
    )
    .min(1, "Informe ao menos um destinatário."),
  expiraDias: z.number().int().min(1).max(365).optional().default(7),
});

export const importacaoDestinatariosSchema = z
  .object({
    formato: z.enum(["CSV_SIMPLE", "CSV_ERP", "XLSX"]).default("CSV_SIMPLE"),
    nomeArquivo: z.string().trim().max(255).optional(),
    conteudo: z.string().min(1, "Arquivo vazio."),
    acao: z.enum(["VALIDAR", "IMPORTAR"]).default("IMPORTAR"),
  })
  .strict();

const respostaItemSchema = z
  .object({
    perguntaId: z.string().trim().min(1),
    opcaoId: z.string().trim().min(1).optional(),
    textoLivre: z.string().trim().min(1).max(4000).optional(),
    valorEscala: z.number().int().min(1).max(10).optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    const preenchidos = [item.opcaoId, item.textoLivre, item.valorEscala].filter(
      (value) => value !== undefined
    ).length;

    if (preenchidos !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada item deve conter exatamente um tipo de resposta.",
      });
    }
  });

export const respostaSchema = z.object({
  itens: z.array(respostaItemSchema).min(1, "Envie ao menos uma resposta."),
}).strict();

export type PesquisaInput = z.infer<typeof pesquisaSchema>;
export type PerguntaInput = z.infer<typeof perguntaSchema>;
export type DisparoInput = z.infer<typeof disparoSchema>;
export type ImportacaoDestinatariosInput = z.infer<typeof importacaoDestinatariosSchema>;
export type RespostaInput = z.infer<typeof respostaSchema>;

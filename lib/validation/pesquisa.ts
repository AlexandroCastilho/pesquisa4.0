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

export const respostaSchema = z.object({
  itens: z.array(
    z.object({
      perguntaId: z.string().min(1),
      opcaoId: z.string().optional(),
      textoLivre: z.string().optional(),
      valorEscala: z.number().int().min(1).max(10).optional(),
    })
  ),
});

export type PesquisaInput = z.infer<typeof pesquisaSchema>;
export type PerguntaInput = z.infer<typeof perguntaSchema>;
export type DisparoInput = z.infer<typeof disparoSchema>;
export type RespostaInput = z.infer<typeof respostaSchema>;

import { z } from "zod";

export const updateUserAccessSchema = z
  .object({
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
    ativo: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.ativo !== undefined, {
    message: "Informe ao menos um campo para atualização.",
  });

export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;
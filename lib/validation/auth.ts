import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export const cadastroSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  company: z.string().trim().min(1, "Informe o nome da empresa.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .max(128)
    .refine((v) => /[A-Za-z]/.test(v), "A senha deve conter pelo menos uma letra.")
    .refine((v) => /\d/.test(v), "A senha deve conter pelo menos um número."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .max(128)
      .refine((v) => /[A-Za-z]/.test(v), "A senha deve conter pelo menos uma letra.")
      .refine((v) => /\d/.test(v), "A senha deve conter pelo menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

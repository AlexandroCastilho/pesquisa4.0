import type { Role } from "@prisma/client";

export type AdminUser = {
  id: string;
  name: string | null;
  company: string | null;
  role: Role;
  ativo: boolean;
  criadoEm: string | Date;
};
import type { Role } from "@prisma/client";

export type AdminUser = {
  id: string;
  name: string | null;
  company: string | null;
  role: Role;
  ativo: boolean;
  criadoEm: string | Date;
};

export type AdminCompanySummary = {
  id: string;
  nome: string;
  slug: string | null;
  criadaEm: string | Date;
  totalUsuarios: number;
  ativos: number;
  inativos: number;
  owners: number;
  admins: number;
  members: number;
};
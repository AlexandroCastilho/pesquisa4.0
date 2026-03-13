"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import { BadgeAtivo, BadgeRole } from "@/components/ui/badge";
import type { AdminUser } from "@/types/admin-user";

type Props = {
  usuariosIniciais: AdminUser[];
  actorRole: Role;
  actorId: string;
};

const allRoles: Role[] = ["OWNER", "ADMIN", "MEMBER"];

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function UsersAccessPanel({ usuariosIniciais, actorRole, actorId }: Props) {
  const [usuarios, setUsuarios] = useState<AdminUser[]>(usuariosIniciais);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function atualizarUsuario(userId: string, payload: { role?: Role; ativo?: boolean }) {
    setLoadingId(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        message?: string;
        detail?: string;
        usuario?: AdminUser;
      };

      if (!response.ok) {
        setError(data.detail ?? data.message ?? "Não foi possível atualizar o usuário.");
        return;
      }

      if (data.usuario) {
        setUsuarios((current) =>
          current.map((item) => (item.id === data.usuario!.id ? { ...item, ...data.usuario } : item))
        );
      }

      setSuccess(data.message ?? "Usuário atualizado com sucesso.");
    } catch {
      setError("Falha de rede ao atualizar o usuário.");
    } finally {
      setLoadingId(null);
    }
  }

  function getAllowedRoles(targetUser: AdminUser): Role[] {
    if (actorRole === "OWNER") {
      return allRoles;
    }

    if (actorRole === "ADMIN" && targetUser.role === "MEMBER") {
      return ["MEMBER"];
    }

    return [targetUser.role];
  }

  return (
    <div className="space-y-6">
      <div className="app-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Usuários da empresa</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Atualize papéis e status de acesso sem sair do contexto da sua empresa.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            OWNER gerencia tudo. ADMIN gerencia apenas usuários MEMBER.
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-[var(--success)]">{success}</p>}

        <div className="mt-6 space-y-4">
          {usuarios.map((usuario) => {
            const disabled = loadingId === usuario.id;
            const allowedRoles = getAllowedRoles(usuario);
            const canChangeRole = allowedRoles.length > 1 || allowedRoles[0] !== usuario.role;
            const canToggleActive = actorRole === "OWNER" || usuario.role === "MEMBER";

            return (
              <div key={usuario.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--card-foreground)]">
                        {usuario.name?.trim() || "Usuário sem nome"}
                      </p>
                      {usuario.id === actorId && (
                        <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Criado em {formatDate(usuario.criadoEm)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <BadgeRole role={usuario.role} />
                      <BadgeAtivo ativo={usuario.ativo} />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_auto] md:items-end">
                    <div>
                      <label className="field-label">Papel</label>
                      <select
                        value={usuario.role}
                        disabled={disabled || !canChangeRole}
                        onChange={(event) => {
                          const nextRole = event.target.value as Role;
                          if (nextRole === usuario.role) return;
                          void atualizarUsuario(usuario.id, { role: nextRole });
                        }}
                        className="field-control"
                      >
                        {allowedRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={disabled || !canToggleActive}
                      onClick={() => void atualizarUsuario(usuario.id, { ativo: !usuario.ativo })}
                      className={usuario.ativo ? "btn-secondary disabled:opacity-60" : "btn-primary disabled:opacity-60"}
                    >
                      {disabled
                        ? "Salvando..."
                        : usuario.ativo
                          ? "Desativar usuário"
                          : "Reativar usuário"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
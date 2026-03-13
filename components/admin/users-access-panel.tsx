"use client";

import { useMemo, useState } from "react";
import type { Role } from "@/types/role";
import { BadgeAtivo, BadgeRole } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminCompanySummary, AdminUser } from "@/types/admin-user";
import { getRoleLabel } from "@/lib/access-control";

type Props = {
  usuariosIniciais: AdminUser[];
  empresa: AdminCompanySummary;
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

export function UsersAccessPanel({ usuariosIniciais, empresa, actorRole, actorId }: Props) {
  const [usuarios, setUsuarios] = useState<AdminUser[]>(usuariosIniciais);
  const [busca, setBusca] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>(() =>
    Object.fromEntries(usuariosIniciais.map((u) => [u.id, u.role])) as Record<string, Role>
  );

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

  function canToggleActive(targetUser: AdminUser): boolean {
    if (actorRole === "OWNER") return true;
    if (actorRole === "ADMIN") return targetUser.role === "MEMBER";
    return false;
  }

  function canApplyRole(targetUser: AdminUser, nextRole: Role): boolean {
    if (targetUser.id === actorId) return false;
    if (actorRole === "OWNER") return true;
    if (actorRole === "ADMIN") return targetUser.role === "MEMBER" && nextRole === "MEMBER";
    return false;
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      const nome = (usuario.name ?? "").toLowerCase();
      return nome.includes(termo);
    });
  }, [usuarios, busca]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-5 lg:col-span-2">
          <p className="text-sm text-[var(--muted-foreground)]">Empresa</p>
          <p className="text-xl font-bold text-[var(--card-foreground)] mt-1">{empresa.nome}</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Slug: {empresa.slug ?? "não definido"}</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Criada em {formatDate(empresa.criadaEm)}</p>
        </div>

        <div className="app-card p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Distribuição de acesso</p>
          <div className="mt-3 space-y-1 text-sm text-[var(--foreground)]">
            <p>Owners: <strong>{empresa.owners}</strong></p>
            <p>Admins: <strong>{empresa.admins}</strong></p>
            <p>Members: <strong>{empresa.members}</strong></p>
            <p>Ativos: <strong>{empresa.ativos}</strong> · Inativos: <strong>{empresa.inativos}</strong></p>
          </div>
        </div>
      </div>

      <div className="app-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Usuários da empresa</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Total de {empresa.totalUsuarios} usuários. Atualize papéis e status de acesso com trilha de decisão clara.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            OWNER: gerencia todos. ADMIN: gerencia apenas MEMBER. MEMBER: sem acesso administrativo.
          </div>
        </div>

        <div className="mt-4">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="field-control"
            placeholder="Buscar usuário por nome"
          />
        </div>

        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
        {success && <div className="mt-4"><Alert tone="success">{success}</Alert></div>}

        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Papel</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {usuariosFiltrados.map((usuario) => {
                const disabled = loadingId === usuario.id;
                const allowedRoles = getAllowedRoles(usuario);
                const nextRole = pendingRole[usuario.id] ?? usuario.role;
                const canSubmitRole = nextRole !== usuario.role && canApplyRole(usuario, nextRole);
                const podeAlternarStatus = canToggleActive(usuario) && usuario.id !== actorId;

                return (
                  <tr key={usuario.id}>
                    <td className="px-4 py-3 text-[var(--card-foreground)] font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{usuario.name?.trim() || "Usuário sem nome"}</span>
                        {usuario.id === actorId ? (
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                            Você
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BadgeRole role={usuario.role} />
                        <select
                          className="field-control max-w-36"
                          value={nextRole}
                          disabled={disabled || !canApplyRole(usuario, nextRole)}
                          onChange={(event) => {
                            const role = event.target.value as Role;
                            setPendingRole((current) => ({ ...current, [usuario.id]: role }));
                          }}
                        >
                          {allowedRoles.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {getRoleLabel(roleOption)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BadgeAtivo ativo={usuario.ativo} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatDate(usuario.criadoEm)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={disabled || !canSubmitRole}
                          className="btn-secondary disabled:opacity-60"
                          onClick={() => {
                            const confirmado = confirm(
                              `Confirmar alteração de papel para ${getRoleLabel(nextRole)}?`
                            );
                            if (!confirmado) return;
                            void atualizarUsuario(usuario.id, { role: nextRole });
                          }}
                        >
                          {disabled ? "Salvando..." : "Aplicar papel"}
                        </button>

                        <button
                          type="button"
                          disabled={disabled || !podeAlternarStatus}
                          className={usuario.ativo ? "btn-danger disabled:opacity-60" : "btn-primary disabled:opacity-60"}
                          onClick={() => {
                            const acao = usuario.ativo ? "desativar" : "reativar";
                            const confirmado = confirm(`Confirmar ${acao} este usuário?`);
                            if (!confirmado) return;
                            void atualizarUsuario(usuario.id, { ativo: !usuario.ativo });
                          }}
                        >
                          {disabled
                            ? "Salvando..."
                            : usuario.ativo
                              ? "Desativar"
                              : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <EmptyState title="Nenhum usuário encontrado" description="Tente outro termo de busca." />
          )}
        </div>
      </div>
    </div>
  );
}
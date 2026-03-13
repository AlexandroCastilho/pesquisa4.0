"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { getRoleLabel } from "@/lib/access-control";

type Props = {
  canManageUsers: boolean;
  companyName: string;
  role: Role;
};

export function Sidebar({ canManageUsers, companyName, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pesquisas", label: "Pesquisas" },
    ...(canManageUsers ? [{ href: "/admin/usuarios", label: "Admin" }] : []),
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <aside className="w-full md:w-72 md:min-h-screen border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--card)]/94 backdrop-blur-xl flex flex-col py-4 md:py-6 px-4">
      <div className="mb-4 md:mb-6 px-2">
        <div className="surface-soft px-3 py-3.5">
          <p className="text-[var(--foreground)] font-bold text-lg tracking-tight">Pesquisa 4.0</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">{companyName}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Perfil: {getRoleLabel(role)}</p>
        </div>
      </div>

      <nav className="flex-1 grid grid-cols-2 md:grid-cols-1 gap-1.5">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition border ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[color:var(--primary)]/30 shadow-sm"
                  : "text-[var(--muted-foreground)] border-transparent hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="btn-secondary mt-3 md:mt-4 justify-center md:justify-start"
      >
        Sair
      </button>
    </aside>
  );
}

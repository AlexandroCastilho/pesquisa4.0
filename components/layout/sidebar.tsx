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
    <aside className="w-full md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--card)]/96 backdrop-blur flex flex-col py-4 md:py-6 px-4">
      <div className="mb-4 md:mb-8 px-2">
        <p className="text-[var(--foreground)] font-semibold text-lg tracking-tight">Pesquisa 4.0</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">{companyName}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Perfil: {getRoleLabel(role)}</p>
      </div>

      <nav className="flex-1 grid grid-cols-2 md:grid-cols-1 gap-1">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="btn-ghost mt-3 md:mt-4 justify-center md:justify-start"
      >
        Sair
      </button>
    </aside>
  );
}

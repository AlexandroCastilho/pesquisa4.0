"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pesquisas", label: "Pesquisas" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col py-6 px-4">
      <div className="mb-8">
        <p className="text-white font-bold text-lg tracking-tight">Pesquisa 4.0</p>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-4 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 text-left transition"
      >
        Sair
      </button>
    </aside>
  );
}

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-auto px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}

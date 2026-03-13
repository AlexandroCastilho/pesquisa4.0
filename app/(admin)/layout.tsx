import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onClick={onClose}>
      <div className="app-card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--card-foreground)]">{title}</h3>
          <button className="btn-ghost px-3" onClick={onClose}>Fechar</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

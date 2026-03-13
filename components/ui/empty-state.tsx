import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="text-[var(--foreground)] font-semibold">{title}</p>
      <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

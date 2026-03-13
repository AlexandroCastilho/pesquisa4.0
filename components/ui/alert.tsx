import type { ReactNode } from "react";

type AlertTone = "error" | "success";

export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return <p className={`alert ${tone === "error" ? "alert-error" : "alert-success"}`}>{children}</p>;
}

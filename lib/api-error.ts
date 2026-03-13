import { NextResponse } from "next/server";

type StatusRule = {
  includes: string;
  status: number;
};

export function createErrorResponse({
  error,
  message,
  statusRules = [],
}: {
  error: unknown;
  message: string;
  statusRules?: StatusRule[];
}): NextResponse {
  const detail = error instanceof Error ? error.message : "erro desconhecido";

  const matchedRule = statusRules.find(
    (rule) => typeof detail === "string" && detail.includes(rule.includes)
  );

  const status = matchedRule?.status ?? 500;

  if (status >= 500) {
    console.error(`[api-error] ${message}:`, error);
  }

  return NextResponse.json({ message, detail }, { status });
}

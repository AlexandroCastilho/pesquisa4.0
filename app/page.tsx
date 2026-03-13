import { redirect } from "next/navigation";
import { getAuthTenantContext } from "@/lib/auth-context";

export default async function HomePage() {
  const ctx = await getAuthTenantContext();

  if (ctx?.profile.ativo) {
    redirect("/dashboard");
  }

  redirect("/login");
}

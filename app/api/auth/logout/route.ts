import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/api-error";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: "Logout realizado." }, { status: 200 });
  } catch (error) {
    return createErrorResponse({ error, message: "Falha ao fazer logout." });
  }
}

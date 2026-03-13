import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_ENV_MISSING: Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente de deploy."
    );
  }

  if (!/^https?:\/\//.test(url)) {
    throw new Error("SUPABASE_URL_INVALID: NEXT_PUBLIC_SUPABASE_URL precisa iniciar com http:// ou https://.");
  }

  return { url, anonKey };
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rotas protegidas: redireciona para login se não autenticado
  if (!user && !pathname.startsWith("/login") && !pathname.startsWith("/cadastro") && !pathname.startsWith("/esqueci-senha") && !pathname.startsWith("/redefinir-senha") && !pathname.startsWith("/callback") && !pathname.startsWith("/responder") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/respostas")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Mantém /login acessível para permitir troca de conta/reautenticação
  // e evita loop de redirecionamento com sessão/cookie inconsistente.
  if (user && pathname === "/cadastro") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

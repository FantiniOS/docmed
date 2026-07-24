import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cria um cliente Supabase para uso em Server Components e Server Actions.
 * Utiliza @supabase/ssr para lidar com cookies (autenticação).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado em Server Components. Middleware atualizará a sessão.
          }
        },
      },
    }
  );
}

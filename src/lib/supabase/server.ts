import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function createClient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // chamado de um Server Component: o middleware já renova a sessão
          }
        },
      },
    }
  );
}

export async function getUser() {
  if (!hasSupabase()) return { supabase: null, user: null };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

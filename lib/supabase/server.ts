import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getPublicEnv } from "@/lib/config/env";

export async function createClient() {
  const env = getPublicEnv();
  if (!env.supabaseUrl || !env.supabasePublishableKey) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Components cannot write cookies; proxy.ts refreshes them. */
          }
        },
      },
    },
  );
}

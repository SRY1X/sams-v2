"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getPublicEnv } from "@/lib/config/env";

export function createClient() {
  const env = getPublicEnv();
  if (!env.supabaseUrl || !env.supabasePublishableKey) return null;
  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
}

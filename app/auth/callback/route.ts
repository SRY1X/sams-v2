import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getSiteOrigin } from "@/lib/config/server-env";
import { createClient } from "@/lib/supabase/server";

/** Exchanges an Auth code when present, then redirects using the validated site origin and next path. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const destination = safeInternalPath(next);
  if (code) {
    const supabase = await createClient();
    if (supabase) await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(destination, getSiteOrigin()));
}

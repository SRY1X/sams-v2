"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getSiteOrigin } from "@/lib/config/server-env";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) redirect("/login?error=invalid");
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=credentials");
  const next = String(formData.get("next") ?? "/dashboard");
  redirect(safeInternalPath(next));
}

export async function requestPasswordReset(formData: FormData) {
  const email = z.email().safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!email.success) redirect("/login?reset=sent");
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${getSiteOrigin()}/auth/callback?next=/auth/reset-password`,
    });
  }
  redirect("/login?reset=sent");
}

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (
    password !== confirmation ||
    password.length < 12 ||
    password.length > 200
  )
    redirect("/auth/reset-password?error=invalid");
  const identity = await getIdentity();
  if (!identity) redirect("/login");
  const { error } = await identity.supabase.auth.updateUser({ password });
  if (error) redirect("/auth/reset-password?error=failed");
  await identity.supabase.auth.signOut();
  redirect("/login?reset=complete");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

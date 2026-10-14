import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getIdentity() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data || typeof data.claims?.sub !== "string") return null;
  return { supabase, userId: data.claims.sub };
}

export async function getMembership() {
  const identity = await getIdentity();
  if (!identity) return null;
  const { data } = await identity.supabase
    .from("institution_memberships")
    .select("id,institution_id,user_id,role,status")
    .eq("user_id", identity.userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { ...data, supabase: identity.supabase };
}

export async function requireMembership(role?: Role) {
  const membership = await getMembership();
  if (!membership) redirect("/access");
  if (role && membership.role !== role && membership.role !== "admin")
    redirect("/dashboard");
  return membership;
}

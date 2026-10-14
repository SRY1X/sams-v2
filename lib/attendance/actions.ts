"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMembership } from "@/lib/auth/session";

export async function startAttendanceSession(formData: FormData) {
  const member = await requireMembership("faculty");
  const sectionId = z
    .uuid()
    .safeParse(String(formData.get("section_id") ?? ""));
  if (!sectionId.success) redirect("/faculty?error=invalid");
  const { data, error } = await member.supabase.rpc(
    "create_attendance_session",
    { p_section_id: sectionId.data },
  );
  if (error || !data) {
    const { data: existing } = await member.supabase
      .from("attendance_sessions")
      .select("id")
      .eq("section_id", sectionId.data)
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (existing?.id) redirect(`/faculty?session=${existing.id}`);
    redirect("/faculty?error=unavailable");
  }
  redirect(`/faculty?session=${data}`);
}

export async function closeAttendanceSession(formData: FormData) {
  const member = await requireMembership("faculty");
  const sessionId = z
    .uuid()
    .safeParse(String(formData.get("session_id") ?? ""));
  if (!sessionId.success) redirect("/faculty?error=invalid");
  const { error } = await member.supabase.rpc("close_attendance_session", {
    p_session_id: sessionId.data,
  });
  revalidatePath("/faculty");
  redirect(error ? "/faculty?error=unavailable" : "/faculty?closed=1");
}

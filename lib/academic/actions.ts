"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMembership } from "@/lib/auth/session";
import type { Database, Role } from "@/lib/database.types";
import { getServerEnv, getSiteOrigin } from "@/lib/config/server-env";

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const uuid = z.uuid();
const requiredText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

function finishAdmin(message: string): never {
  revalidatePath("/admin");
  redirect(`/admin?result=${encodeURIComponent(message)}`);
}

export async function createDepartment(form: FormData) {
  const member = await requireMembership("admin");
  const name = requiredText(2, 120).safeParse(text(form, "name"));
  const code = z.string().trim().max(24).safeParse(text(form, "code"));
  if (!name.success || !code.success) finishAdmin("invalid");
  const { error } = await member.supabase.from("departments").insert({
    institution_id: member.institution_id,
    name: name.data,
    code: code.data || null,
  });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function createTerm(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({
      name: requiredText(2, 100),
      starts_on: z.iso.date(),
      ends_on: z.iso.date(),
    })
    .safeParse({
      name: text(form, "name"),
      starts_on: text(form, "starts_on"),
      ends_on: text(form, "ends_on"),
    });
  if (!parsed.success || parsed.data.starts_on >= parsed.data.ends_on)
    finishAdmin("invalid");
  const { error } = await member.supabase
    .from("academic_terms")
    .insert({ institution_id: member.institution_id, ...parsed.data });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function createCourse(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({
      code: requiredText(1, 40),
      title: requiredText(2, 160),
      department_id: z.union([uuid, z.literal("")]),
    })
    .safeParse({
      code: text(form, "code"),
      title: text(form, "title"),
      department_id: text(form, "department_id"),
    });
  if (!parsed.success) finishAdmin("invalid");
  const { error } = await member.supabase.from("courses").insert({
    institution_id: member.institution_id,
    code: parsed.data.code,
    title: parsed.data.title,
    department_id: parsed.data.department_id || null,
  });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function createSection(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({
      course_id: uuid,
      term_id: uuid,
      section_code: requiredText(1, 40),
    })
    .safeParse({
      course_id: text(form, "course_id"),
      term_id: text(form, "term_id"),
      section_code: text(form, "section_code"),
    });
  if (!parsed.success) finishAdmin("invalid");
  const { error } = await member.supabase
    .from("course_sections")
    .insert({ institution_id: member.institution_id, ...parsed.data });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function assignFaculty(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({ section_id: uuid, faculty_user_id: uuid })
    .safeParse({
      section_id: text(form, "section_id"),
      faculty_user_id: text(form, "faculty_user_id"),
    });
  if (!parsed.success) finishAdmin("invalid");
  const { error } = await member.supabase
    .from("section_faculty")
    .insert({ institution_id: member.institution_id, ...parsed.data });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function enrollStudent(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({ section_id: uuid, student_user_id: uuid })
    .safeParse({
      section_id: text(form, "section_id"),
      student_user_id: text(form, "student_user_id"),
    });
  if (!parsed.success) finishAdmin("invalid");
  const { error } = await member.supabase
    .from("enrollments")
    .insert({ institution_id: member.institution_id, ...parsed.data });
  finishAdmin(error ? "save-failed" : "saved");
}

export async function setMembershipStatus(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({ user_id: uuid, status: z.enum(["active", "suspended"]) })
    .safeParse({
      user_id: text(form, "user_id"),
      status: text(form, "status"),
    });
  if (!parsed.success || parsed.data.user_id === member.user_id)
    finishAdmin("invalid");
  const { error } = await member.supabase
    .from("institution_memberships")
    .update({ status: parsed.data.status })
    .eq("institution_id", member.institution_id)
    .eq("user_id", parsed.data.user_id);
  finishAdmin(error ? "save-failed" : "saved");
}

export async function inviteMember(form: FormData) {
  const member = await requireMembership("admin");
  const parsed = z
    .object({
      email: z.email().max(254),
      role: z.enum(["student", "faculty"]),
      display_name: requiredText(1, 120),
    })
    .safeParse({
      email: text(form, "email").toLowerCase(),
      role: text(form, "role"),
      display_name: text(form, "display_name"),
    });
  if (!parsed.success) finishAdmin("invalid");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) finishAdmin("invite-unavailable");
  let serverEnv: ReturnType<typeof getServerEnv>;
  let siteOrigin: string;
  try {
    serverEnv = getServerEnv();
    siteOrigin = getSiteOrigin();
  } catch {
    finishAdmin("invite-unavailable");
  }

  // This elevated client is isolated to the admin-checked invitation operation.
  const adminClient = createSupabaseClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    secret,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const { data: invite, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { full_name: parsed.data.display_name },
      redirectTo: `${siteOrigin}/auth/callback`,
    });
  if (inviteError || !invite.user) finishAdmin("invite-failed");
  const role = parsed.data.role as Extract<Role, "student" | "faculty">;
  const { error: membershipError } = await adminClient
    .from("institution_memberships")
    .insert({
      institution_id: member.institution_id,
      user_id: invite.user.id,
      role,
      status: "active",
    });
  if (membershipError) {
    await adminClient.auth.admin.deleteUser(invite.user.id);
    finishAdmin("invite-failed");
  }
  await adminClient.from("audit_events").insert({
    institution_id: member.institution_id,
    actor_id: member.user_id,
    action: "membership.invited",
    entity_type: "institution_membership",
    details: { role },
  });
  finishAdmin("invited");
}

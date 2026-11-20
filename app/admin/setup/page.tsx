import { AdminWorkspace } from "@/components/admin-workspace";
import { formatInstitutionDateTime } from "@/lib/config/format";
import type { ReactNode } from "react";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";
import {
  assignFaculty,
  createCourse,
  createDepartment,
  createSection,
  createTerm,
  enrollStudent,
  inviteMember,
  setMembershipStatus,
} from "@/lib/academic/actions";

function Field({
  label,
  name,
  type = "text",
  required = true,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input !min-h-10 !text-xs"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
function SelectField({
  label,
  name,
  items,
  placeholder,
}: {
  label: string;
  name: string;
  items: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        className="input !min-h-10 !text-xs"
        name={name}
        defaultValue=""
        required
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Panel({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="surface p-5" id={id}>
      <h2 className="text-sm font-bold">{title}</h2>
      <p className="mt-1 text-[11px] leading-5 text-[#b4b4b4]">{description}</p>
      {children}
    </section>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMembership("admin");
  const query = await searchParams;
  const [
    profileResult,
    institutionResult,
    departmentsResult,
    termsResult,
    coursesResult,
    sectionsResult,
    membershipsResult,
    auditResult,
  ] = await Promise.all([
    member.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", member.user_id)
      .maybeSingle(),
    member.supabase
      .from("institutions")
      .select("name,timezone")
      .eq("id", member.institution_id)
      .maybeSingle(),
    member.supabase
      .from("departments")
      .select("id,name,code")
      .eq("institution_id", member.institution_id)
      .order("name"),
    member.supabase
      .from("academic_terms")
      .select("id,name,starts_on,ends_on")
      .eq("institution_id", member.institution_id)
      .order("starts_on", { ascending: false }),
    member.supabase
      .from("courses")
      .select("id,code,title,department_id")
      .eq("institution_id", member.institution_id)
      .order("code"),
    member.supabase
      .from("course_sections")
      .select("id,course_id,term_id,section_code")
      .eq("institution_id", member.institution_id)
      .order("section_code"),
    member.supabase
      .from("institution_memberships")
      .select("id,user_id,role,status")
      .eq("institution_id", member.institution_id)
      .order("created_at", { ascending: false })
      .limit(1000),
    member.supabase
      .from("audit_events")
      .select("id,action,entity_type,created_at")
      .eq("institution_id", member.institution_id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const profile = requireSupabaseData(profileResult, "administrator profile");
  const institution = requireSupabaseData(
    institutionResult,
    "institution details",
  );
  const departments = requireSupabaseData(departmentsResult, "department list");
  const terms = requireSupabaseData(termsResult, "academic term list");
  const courses = requireSupabaseData(coursesResult, "course list");
  const sections = requireSupabaseData(sectionsResult, "course section list");
  const memberships = requireSupabaseData(
    membershipsResult,
    "institution member list",
  );
  const audit = requireSupabaseData(auditResult, "recent activity") ?? [];
  const memberIds = [...new Set((memberships ?? []).map((row) => row.user_id))];
  const memberProfiles = memberIds.length
    ? requireSupabaseData(
        await member.supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", memberIds),
        "member profile list",
      )
    : [];
  const profileById = new Map(
    (memberProfiles ?? []).map((row) => [row.id, row.display_name]),
  );
  const courseById = new Map((courses ?? []).map((row) => [row.id, row]));
  const result = typeof query.result === "string" ? query.result : "";

  return (
    <AdminWorkspace
      active="setup"
      name={profile?.display_name ?? "Administrator"}
      institution={institution?.name ?? "Institution workspace"}
      timezone={institution?.timezone ?? "UTC"}
    >
      <main className="admin-main">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="admin-eyebrow">Institution setup</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {institution?.name ?? "Academic setup"}
            </h1>
            <p className="mt-2 text-sm text-[#b4b4b4]">
              Manage academic structure and member access for this institution.
            </p>
          </div>
          <span className="badge neutral">
            {institution?.timezone ?? "UTC"}
          </span>
        </div>
        {result && (
          <div
            className={`mt-6 rounded-lg border p-3 text-xs ${result === "saved" || result === "invited" ? "border-[#2e2e2e] bg-[#102b1e] text-[#3ecf8e]" : "border-[#63342e] bg-[#261715] text-[#ff9588]"}`}
            role="status"
          >
            {result === "saved"
              ? "Changes saved."
              : result === "invited"
                ? "Invitation sent and role assigned."
                : result === "invite-unavailable"
                  ? "Invitations are disabled until SUPABASE_SERVICE_ROLE_KEY is configured on the server."
                  : result === "invite-failed"
                    ? "Invitation could not be completed. Check the account and provider configuration."
                    : result === "invalid"
                      ? "Check the supplied fields and try again."
                      : "This change could not be saved. Check for duplicates and verify the selected records."}
          </div>
        )}
        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Departments", departments?.length ?? 0],
            ["Academic terms", terms?.length ?? 0],
            ["Courses", courses?.length ?? 0],
            ["Course sections", sections?.length ?? 0],
          ].map(([label, count]) => (
            <div key={label} className="surface p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#b4b4b4]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold">{count}</p>
            </div>
          ))}
        </section>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-6">
            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold">Academic structure</h2>
                <p className="mt-1 text-xs text-[#b4b4b4]">
                  Create the records used by student and faculty workflows.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Panel
                  title="Add department"
                  description="A neutral organizational unit; customize terminology through configuration."
                >
                  <form action={createDepartment} className="mt-4 space-y-3">
                    <Field
                      label="Department name"
                      name="name"
                      placeholder="Department of Science"
                    />
                    <Field
                      label="Short code"
                      name="code"
                      required={false}
                      placeholder="SCI"
                    />
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Add department
                    </button>
                  </form>
                </Panel>
                <Panel
                  title="Add academic term"
                  description="Terms use dates and institution timezone settings."
                >
                  <form action={createTerm} className="mt-4 space-y-3">
                    <Field
                      label="Term name"
                      name="name"
                      placeholder="2026 · Term 1"
                    />
                    <Field label="Starts on" name="starts_on" type="date" />
                    <Field label="Ends on" name="ends_on" type="date" />
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Add term
                    </button>
                  </form>
                </Panel>
                <Panel
                  title="Add course"
                  description="Course codes are unique within this institution."
                >
                  <form action={createCourse} className="mt-4 space-y-3">
                    <Field
                      label="Course code"
                      name="code"
                      placeholder="BIO-101"
                    />
                    <Field
                      label="Course title"
                      name="title"
                      placeholder="Introduction to Biology"
                    />
                    <label className="block">
                      <span className="label">Department (optional)</span>
                      <select
                        className="input !min-h-10 !text-xs"
                        name="department_id"
                        defaultValue=""
                      >
                        <option value="">No department</option>
                        {departments?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Add course
                    </button>
                  </form>
                </Panel>
                <Panel
                  title="Open course section"
                  description="Connect an existing course to a term and section identifier."
                >
                  <form action={createSection} className="mt-4 space-y-3">
                    <SelectField
                      label="Course"
                      name="course_id"
                      placeholder="Choose a course"
                      items={(courses ?? []).map((c) => ({
                        id: c.id,
                        label: `${c.code} · ${c.title}`,
                      }))}
                    />
                    <SelectField
                      label="Academic term"
                      name="term_id"
                      placeholder="Choose a term"
                      items={(terms ?? []).map((t) => ({
                        id: t.id,
                        label: t.name,
                      }))}
                    />
                    <Field
                      label="Section code"
                      name="section_code"
                      placeholder="A"
                    />
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Create section
                    </button>
                  </form>
                </Panel>
              </div>
            </section>
            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold">
                  Assignments and enrollments
                </h2>
                <p className="mt-1 text-xs text-[#b4b4b4]">
                  Choose an active account by name and role.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Panel
                  title="Assign faculty"
                  description="Only an active faculty membership can be assigned."
                >
                  <form action={assignFaculty} className="mt-4 space-y-3">
                    <SelectField
                      label="Section"
                      name="section_id"
                      placeholder="Choose a section"
                      items={(sections ?? []).map((s) => ({
                        id: s.id,
                        label: `${courseById.get(s.course_id)?.code ?? "Course"} · ${s.section_code}`,
                      }))}
                    />
                    <SelectField
                      label="Faculty member"
                      name="faculty_user_id"
                      items={(memberships ?? [])
                        .filter(
                          (m) => m.role === "faculty" && m.status === "active",
                        )
                        .map((m) => ({
                          id: m.user_id,
                          label: `${profileById.get(m.user_id) ?? "Faculty member"} · ${m.user_id.slice(0, 8)}`,
                        }))}
                      placeholder="Choose a faculty member"
                    />
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Assign faculty
                    </button>
                  </form>
                </Panel>
                <Panel
                  title="Enroll student"
                  description="Only an active student membership can be enrolled."
                >
                  <form action={enrollStudent} className="mt-4 space-y-3">
                    <SelectField
                      label="Section"
                      name="section_id"
                      placeholder="Choose a section"
                      items={(sections ?? []).map((s) => ({
                        id: s.id,
                        label: `${courseById.get(s.course_id)?.code ?? "Course"} · ${s.section_code}`,
                      }))}
                    />
                    <SelectField
                      label="Student member"
                      name="student_user_id"
                      items={(memberships ?? [])
                        .filter(
                          (m) => m.role === "student" && m.status === "active",
                        )
                        .map((m) => ({
                          id: m.user_id,
                          label: `${profileById.get(m.user_id) ?? "Student"} · ${m.user_id.slice(0, 8)}`,
                        }))}
                      placeholder="Choose a student"
                    />
                    <button
                      className="button !min-h-9 !text-[11px]"
                      type="submit"
                    >
                      Enroll student
                    </button>
                  </form>
                </Panel>
              </div>
            </section>
            <Panel
              id="invite"
              title="Invite a member"
              description="Invitations require the server-only service key. Roles are assigned by this protected admin action."
            >
              <form
                action={inviteMember}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <Field
                  label="Full name"
                  name="display_name"
                  placeholder="Alex Morgan"
                />
                <Field
                  label="Institution email"
                  name="email"
                  type="email"
                  placeholder="alex@example.edu"
                />
                <label className="block">
                  <span className="label">Role</span>
                  <select
                    className="input !min-h-10 !text-xs"
                    name="role"
                    defaultValue="student"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    className="button !min-h-10 !text-[11px]"
                    type="submit"
                  >
                    Send invitation
                  </button>
                </div>
              </form>
            </Panel>
          </div>
          <aside className="space-y-6">
            <section className="surface overflow-hidden">
              <div className="border-b border-[#2e2e2e] px-5 py-4">
                <h2 className="text-sm font-bold">Institution members</h2>
                <p className="mt-1 text-[10px] text-[#b4b4b4]">
                  Suspend or restore a member. Role changes require a trusted
                  owner operation.
                </p>
              </div>
              <div className="table-wrap max-h-[460px]">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <b>{profileById.get(item.user_id) ?? "Member"}</b>
                          <span className="mt-1 block max-w-[145px] truncate font-mono text-[9px] text-[#898989]">
                            {item.user_id}
                          </span>
                        </td>
                        <td>
                          <span className="badge neutral">{item.role}</span>
                        </td>
                        <td>
                          <form action={setMembershipStatus}>
                            <input
                              type="hidden"
                              name="user_id"
                              value={item.user_id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value={
                                item.status === "active"
                                  ? "suspended"
                                  : "active"
                              }
                            />
                            <button
                              className="text-[10px] font-bold text-[#3ecf8e]"
                              type="submit"
                              disabled={item.user_id === member.user_id}
                            >
                              {item.user_id === member.user_id
                                ? "Current admin"
                                : item.status === "active"
                                  ? "Suspend"
                                  : "Restore"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {!memberships?.length && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-10 text-center text-xs text-[#b4b4b4]"
                        >
                          No members yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="surface overflow-hidden">
              <div className="border-b border-[#2e2e2e] px-5 py-4">
                <h2 className="text-sm font-bold">Recent audit events</h2>
                <p className="mt-1 text-[10px] text-[#b4b4b4]">
                  Security-sensitive actions, newest first.
                </p>
              </div>
              <div className="divide-y divide-[#2e2e2e]">
                {audit?.map((event) => (
                  <div key={event.id} className="px-5 py-3">
                    <p className="text-xs font-semibold">
                      {event.action.replaceAll(".", " · ")}
                    </p>
                    <p className="mt-1 text-[10px] text-[#b4b4b4]">
                      {event.entity_type} ·{" "}
                      {formatInstitutionDateTime(
                        event.created_at,
                        institution?.timezone ?? "UTC",
                      )}
                    </p>
                  </div>
                ))}
                {!audit?.length && (
                  <p className="px-5 py-8 text-center text-xs text-[#b4b4b4]">
                    No audit events recorded.
                  </p>
                )}
              </div>
            </section>
            <p className="rounded-xl bg-[#242424] p-4 text-[10px] leading-5 text-[#b4b4b4]">
              Initial administrator setup is documented in{" "}
              <code className="font-mono">docs/setup.md</code>. Admin membership
              cannot be self-assigned from this interface.
            </p>
          </aside>
        </div>
        <p className="mt-8 text-[10px] text-[#898989]">
          Academic records, membership changes, and attendance remain scoped to
          this institution by database policies.
        </p>
      </main>
    </AdminWorkspace>
  );
}

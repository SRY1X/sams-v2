import { AppHeader } from "@/components/app-header";
import type { ReactNode } from "react";
import { requireMembership } from "@/lib/auth/session";
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
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface p-5">
      <h2 className="text-sm font-bold">{title}</h2>
      <p className="mt-1 text-[11px] leading-5 text-[#a1a1a1]">{description}</p>
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
    { data: profile },
    { data: institution },
    { data: departments },
    { data: terms },
    { data: courses },
    { data: sections },
    { data: memberships },
    { data: audit },
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
      .limit(100),
    member.supabase
      .from("audit_events")
      .select("id,action,entity_type,created_at")
      .eq("institution_id", member.institution_id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const memberIds = [...new Set((memberships ?? []).map((row) => row.user_id))];
  const { data: memberProfiles } = memberIds.length
    ? await member.supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", memberIds)
    : { data: [] };
  const profileById = new Map(
    (memberProfiles ?? []).map((row) => [row.id, row.display_name]),
  );
  const courseById = new Map((courses ?? []).map((row) => [row.id, row]));
  const result = typeof query.result === "string" ? query.result : "";

  return (
    <>
      <AppHeader role="admin" name={profile?.display_name ?? "Administrator"} />
      <main className="shell py-9 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Institution administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {institution?.name ?? "Academic setup"}
            </h1>
            <p className="mt-2 text-sm text-[#a1a1a1]">
              Manage academic structure and member access for this institution.
            </p>
          </div>
          <span className="badge neutral">
            {institution?.timezone ?? "UTC"}
          </span>
        </div>
        {result && (
          <div
            className={`mt-6 rounded-lg border p-3 text-xs ${result === "saved" || result === "invited" ? "border-[#262626] bg-[#142019] text-[#7cc9a0]" : "border-[#63342e] bg-[#261715] text-[#ff9588]"}`}
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
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a1a1a1]">
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
                <p className="mt-1 text-xs text-[#a1a1a1]">
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
                <p className="mt-1 text-xs text-[#a1a1a1]">
                  Use an existing member’s user ID from the roster below.
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
                    <Field
                      label="Faculty user ID"
                      name="faculty_user_id"
                      placeholder="UUID from the member roster"
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
                    <Field
                      label="Student user ID"
                      name="student_user_id"
                      placeholder="UUID from the member roster"
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
              <div className="border-b border-[#262626] px-5 py-4">
                <h2 className="text-sm font-bold">Institution members</h2>
                <p className="mt-1 text-[10px] text-[#a1a1a1]">
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
                          <span className="mt-1 block max-w-[145px] truncate font-mono text-[9px] text-[#737373]">
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
                              className="text-[10px] font-bold text-[#ff8833]"
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
                          className="py-10 text-center text-xs text-[#a1a1a1]"
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
              <div className="border-b border-[#262626] px-5 py-4">
                <h2 className="text-sm font-bold">Recent audit events</h2>
                <p className="mt-1 text-[10px] text-[#a1a1a1]">
                  Security-sensitive actions, newest first.
                </p>
              </div>
              <div className="divide-y divide-[#262626]">
                {audit?.map((event) => (
                  <div key={event.id} className="px-5 py-3">
                    <p className="text-xs font-semibold">
                      {event.action.replaceAll(".", " · ")}
                    </p>
                    <p className="mt-1 text-[10px] text-[#a1a1a1]">
                      {event.entity_type} ·{" "}
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!audit?.length && (
                  <p className="px-5 py-8 text-center text-xs text-[#a1a1a1]">
                    No audit events recorded.
                  </p>
                )}
              </div>
            </section>
            <p className="rounded-xl bg-[#171717] p-4 text-[10px] leading-5 text-[#a1a1a1]">
              Initial administrator setup is documented in{" "}
              <code className="font-mono">docs/setup.md</code>. Admin membership
              cannot be self-assigned from this interface.
            </p>
          </aside>
        </div>
        <p className="mt-8 text-[10px] text-[#737373]">
          Academic records, membership changes, and attendance remain scoped to
          this institution by database policies.
        </p>
      </main>
    </>
  );
}

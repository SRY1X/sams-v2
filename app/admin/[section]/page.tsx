import { AdminWorkspace } from "@/components/admin-workspace";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";
import { notFound } from "next/navigation";
import Link from "next/link";

type RecordRow = {
  id: string;
  title: string;
  detail: string;
  group: string;
  status: string;
};
const titles: Record<string, string> = {
  students: "Students",
  faculty: "Faculty",
  departments: "Branches",
  courses: "Courses",
  sections: "Sections",
  terms: "Academic terms",
  enrollments: "Enrollments",
  attendance: "Attendance sessions",
  activity: "Activity log",
};

export default async function AdminRecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMembership("admin");
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (!Object.hasOwn(titles, section)) notFound();
  const q = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const statusFilter = typeof query.status === "string" ? query.status : "";
  const groupFilter = typeof query.group === "string" ? query.group : "";
  const needsMembers = ["students", "faculty", "enrollments"].includes(section);
  const needsDepartments = ["departments", "courses", "sections"].includes(
    section,
  );
  const needsTerms = [
    "terms",
    "sections",
    "enrollments",
    "attendance",
  ].includes(section);
  const needsCourses = [
    "courses",
    "sections",
    "enrollments",
    "attendance",
  ].includes(section);
  const needsSections = ["sections", "enrollments", "attendance"].includes(
    section,
  );
  const [
    profileResult,
    institutionResult,
    departmentsResult,
    termsResult,
    coursesResult,
    sectionsResult,
    membershipsResult,
    enrollmentsResult,
    sessionsResult,
    assignmentsResult,
    attendanceResult,
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
    needsDepartments
      ? member.supabase
          .from("departments")
          .select("id,name,code")
          .eq("institution_id", member.institution_id)
          .order("name")
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    needsTerms
      ? member.supabase
          .from("academic_terms")
          .select("id,name,starts_on,ends_on")
          .eq("institution_id", member.institution_id)
          .order("starts_on", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    needsCourses
      ? member.supabase
          .from("courses")
          .select("id,code,title,department_id")
          .eq("institution_id", member.institution_id)
          .order("code")
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    needsSections
      ? member.supabase
          .from("course_sections")
          .select("id,course_id,term_id,section_code")
          .eq("institution_id", member.institution_id)
          .order("section_code")
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    needsMembers
      ? member.supabase
          .from("institution_memberships")
          .select("id,user_id,role,status,created_at")
          .eq("institution_id", member.institution_id)
          .eq("role", section === "faculty" ? "faculty" : "student")
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    section === "enrollments"
      ? member.supabase
          .from("enrollments")
          .select("id,section_id,student_user_id,status")
          .eq("institution_id", member.institution_id)
          .order("created_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [], error: null }),
    section === "attendance"
      ? member.supabase
          .from("attendance_sessions")
          .select("id,section_id,status,starts_at,expires_at,closed_at")
          .eq("institution_id", member.institution_id)
          .order("starts_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    section === "faculty"
      ? member.supabase
          .from("section_faculty")
          .select("section_id,faculty_user_id")
          .eq("institution_id", member.institution_id)
          .limit(1000)
      : Promise.resolve({ data: [], error: null }),
    section === "attendance"
      ? member.supabase
          .from("attendance_records")
          .select("session_id")
          .eq("institution_id", member.institution_id)
          .limit(5000)
      : Promise.resolve({ data: [], error: null }),
    section === "activity"
      ? member.supabase
          .from("audit_events")
          .select("id,action,entity_type,created_at")
          .eq("institution_id", member.institution_id)
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
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
  const enrollments = requireSupabaseData(enrollmentsResult, "enrollment list");
  const sessions = requireSupabaseData(
    sessionsResult,
    "attendance session list",
  );
  const assignments = requireSupabaseData(
    assignmentsResult,
    "faculty assignment list",
  );
  const attendance = requireSupabaseData(
    attendanceResult,
    "attendance record list",
  );
  const audit = requireSupabaseData(auditResult, "audit activity list");
  const ids = [...new Set((memberships ?? []).map((x) => x.user_id))];
  const profiles = ids.length
    ? requireSupabaseData(
        await member.supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", ids),
        "member profile list",
      )
    : [];
  const names = new Map(
    (profiles ?? []).map((x) => [x.id, x.display_name || "Member"]),
  );
  const departmentById = new Map((departments ?? []).map((x) => [x.id, x]));
  const courseById = new Map((courses ?? []).map((x) => [x.id, x]));
  const termById = new Map((terms ?? []).map((x) => [x.id, x]));
  const sectionById = new Map((sections ?? []).map((x) => [x.id, x]));
  const sessionCounts = new Map<string, number>();
  for (const row of attendance ?? [])
    sessionCounts.set(
      row.session_id,
      (sessionCounts.get(row.session_id) ?? 0) + 1,
    );
  let rows: RecordRow[] = [];
  if (section === "students" || section === "faculty")
    rows = (memberships ?? [])
      .filter(
        (x) => x.role === (section === "students" ? "student" : "faculty"),
      )
      .map((x) => ({
        id: x.id,
        title: names.get(x.user_id) ?? "Member",
        detail: `Member since ${formatInstitutionDateTime(x.created_at, institution?.timezone ?? "UTC")}${section === "faculty" ? ` · ${(assignments ?? []).filter((a) => a.faculty_user_id === x.user_id).length} assigned section(s)` : ""}`,
        group: x.role,
        status: x.status,
      }));
  if (section === "departments")
    rows = (departments ?? []).map((x) => ({
      id: x.id,
      title: x.name,
      detail: x.code ?? "No short code",
      group: "Branch",
      status: "—",
    }));
  if (section === "courses")
    rows = (courses ?? []).map((x) => ({
      id: x.id,
      title: `${x.code} · ${x.title}`,
      detail:
        departmentById.get(x.department_id ?? "")?.name ?? "No branch assigned",
      group: "Course",
      status: "—",
    }));
  if (section === "terms")
    rows = (terms ?? []).map((x) => ({
      id: x.id,
      title: x.name,
      detail: `${x.starts_on} — ${x.ends_on}`,
      group: "Academic term",
      status: "—",
    }));
  if (section === "sections")
    rows = (sections ?? []).map((x) => ({
      id: x.id,
      title: `${courseById.get(x.course_id)?.code ?? "Course"} · ${x.section_code}`,
      detail: termById.get(x.term_id)?.name ?? "Term unavailable",
      group:
        departmentById.get(courseById.get(x.course_id)?.department_id ?? "")
          ?.name ?? "No branch",
      status: "Listed",
    }));
  if (section === "enrollments")
    rows = (enrollments ?? []).map((x) => {
      const s = sectionById.get(x.section_id);
      return {
        id: x.id,
        title: names.get(x.student_user_id) ?? "Student",
        detail: `${courseById.get(s?.course_id ?? "")?.code ?? "Course"} · ${s?.section_code ?? "Section"} · ${termById.get(s?.term_id ?? "")?.name ?? "Term"}`,
        group: "Enrollment",
        status: x.status,
      };
    });
  if (section === "attendance")
    rows = (sessions ?? []).map((x) => {
      const s = sectionById.get(x.section_id);
      return {
        id: x.id,
        title: `${courseById.get(s?.course_id ?? "")?.code ?? "Course"} · ${s?.section_code ?? "Section"}`,
        detail: `${sessionCounts.get(x.id) ?? 0} check-ins · ${formatInstitutionDateTime(x.starts_at, institution?.timezone ?? "UTC")}`,
        group: termById.get(s?.term_id ?? "")?.name ?? "Attendance session",
        status: x.status,
      };
    });
  if (section === "activity")
    rows = (audit ?? []).map((x) => ({
      id: x.id,
      title: x.action.replaceAll(".", " · "),
      detail: `${x.entity_type} · ${formatInstitutionDateTime(x.created_at, institution?.timezone ?? "UTC")}`,
      group: "Audit event",
      status: "Recorded",
    }));
  const filtered = rows.filter(
    (r) =>
      (!q ||
        `${r.title} ${r.detail} ${r.group} ${r.status}`
          .toLowerCase()
          .includes(q)) &&
      (!statusFilter || r.status.toLowerCase() === statusFilter) &&
      (!groupFilter || r.group === groupFilter),
  );
  const statuses = [
    ...new Set(rows.map((r) => r.status).filter((x) => x !== "—")),
  ];
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <AdminWorkspace
      active={section}
      name={profile?.display_name ?? "Administrator"}
      institution={institution?.name ?? "Institution workspace"}
      timezone={institution?.timezone ?? "UTC"}
      sidebarNote="Records are institution scoped"
    >
      <main className="admin-main">
        <header className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Manage records</p>
            <h1>{titles[section]}</h1>
            <p>
              Search and filter institution records. Changes remain protected by
              database policies.
            </p>
          </div>
          {section === "students" || section === "faculty" ? (
            <Link className="admin-primary" href="/admin/setup#invite">
              + Invite member
            </Link>
          ) : null}
        </header>
        <section className="admin-card admin-record-card">
          <form method="get" className="admin-filters">
            <label className="admin-search">
              <span className="sr-only">
                Search {titles[section].toLowerCase()}
              </span>
              <input
                name="q"
                defaultValue={typeof query.q === "string" ? query.q : ""}
                placeholder="Search names, codes, or related records"
              />
              <span aria-hidden="true">⌕</span>
            </label>
            {statuses.length > 1 || statusFilter ? (
              <label className="admin-filter-label">
                <span>Status</span>
                <select name="status" defaultValue={statusFilter}>
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s.toLowerCase()}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {groups.length > 1 || groupFilter ? (
              <label className="admin-filter-label">
                <span>Group</span>
                <select name="group" defaultValue={groupFilter}>
                  <option value="">All groups</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button className="admin-ghost" type="submit">
              Apply filters
            </button>
            <Link className="admin-text-link" href={`/admin/${section}`}>
              Reset
            </Link>
          </form>
          <div className="admin-table-meta">
            {filtered.length} record{filtered.length === 1 ? "" : "s"} shown{" "}
            <span>
              Showing up to {rows.length} records · use search and filters to
              narrow results
            </span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Details</th>
                  <th>Group</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.title}</strong>
                    </td>
                    <td>{r.detail}</td>
                    <td>{r.group}</td>
                    <td>
                      <span
                        className={`admin-status ${r.status.toLowerCase() === "active" || r.status.toLowerCase() === "open" || r.status.toLowerCase() === "recorded" ? "good" : ""}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className="admin-empty">
                      No matching records. Try changing or clearing the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <p className="admin-footnote">
          Student names are visible here only to authorized institution
          administrators and assigned staff.
        </p>
      </main>
    </AdminWorkspace>
  );
}

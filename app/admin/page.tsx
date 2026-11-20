import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AdminNavigation } from "@/components/admin-navigation";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";

const card = "admin-card";

export default async function AdminOverview() {
  const member = await requireMembership("admin");
  const [
    profileResult,
    institutionResult,
    studentCount,
    facultyCount,
    branchCount,
    courseCount,
    sectionCount,
    termCount,
    enrollmentCount,
    sessionCount,
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
      .from("institution_memberships")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id)
      .eq("role", "student")
      .eq("status", "active"),
    member.supabase
      .from("institution_memberships")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id)
      .eq("role", "faculty")
      .eq("status", "active"),
    member.supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id),
    member.supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id),
    member.supabase
      .from("course_sections")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id),
    member.supabase
      .from("academic_terms")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id),
    member.supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id)
      .eq("status", "active"),
    member.supabase
      .from("attendance_sessions")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", member.institution_id)
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString()),
    member.supabase
      .from("audit_events")
      .select("id,action,entity_type,created_at")
      .eq("institution_id", member.institution_id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const profile = requireSupabaseData(profileResult, "administrator profile");
  const institution = requireSupabaseData(
    institutionResult,
    "institution details",
  );
  const audit = requireSupabaseData(auditResult, "recent activity") ?? [];
  requireSupabaseData(studentCount, "student count");
  requireSupabaseData(facultyCount, "faculty count");
  requireSupabaseData(branchCount, "branch count");
  requireSupabaseData(courseCount, "course count");
  requireSupabaseData(sectionCount, "section count");
  requireSupabaseData(termCount, "academic term count");
  requireSupabaseData(enrollmentCount, "enrollment count");
  requireSupabaseData(sessionCount, "active session count");
  const metrics = [
    {
      label: "Students",
      value: studentCount.count ?? 0,
      href: "/admin/students",
      hint: "Active memberships",
    },
    {
      label: "Faculty",
      value: facultyCount.count ?? 0,
      href: "/admin/faculty",
      hint: "Active memberships",
    },
    {
      label: "Branches",
      value: branchCount.count ?? 0,
      href: "/admin/departments",
      hint: "Academic units",
    },
    {
      label: "Courses",
      value: courseCount.count ?? 0,
      href: "/admin/courses",
      hint: "Catalog records",
    },
    {
      label: "Sections",
      value: sectionCount.count ?? 0,
      href: "/admin/sections",
      hint: "Across all terms",
    },
    {
      label: "Terms",
      value: termCount.count ?? 0,
      href: "/admin/terms",
      hint: "Academic periods",
    },
    {
      label: "Enrollments",
      value: enrollmentCount.count ?? 0,
      href: "/admin/enrollments",
      hint: "Active student places",
    },
    {
      label: "Live sessions",
      value: sessionCount.count ?? 0,
      href: "/admin/attendance",
      hint: "Currently open",
    },
  ];

  return (
    <div className="admin-workspace">
      <AppHeader role="admin" name={profile?.display_name ?? "Administrator"} />
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">
            <span className="admin-mark">S</span>
            <div>
              <strong>Administration</strong>
              <small>{institution?.name ?? "Institution workspace"}</small>
            </div>
          </div>
          <AdminNavigation active="overview" />
          <div className="admin-sidebar-foot">
            Workspace timezone
            <br />
            <b>{institution?.timezone ?? "UTC"}</b>
          </div>
        </aside>
        <main className="admin-main">
          <header className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Institution overview</p>
              <h1>{institution?.name ?? "Administration"}</h1>
              <p>
                Review your academic structure and jump into the records that
                need attention.
              </p>
            </div>
            <Link className="admin-primary" href="/admin/setup">
              + Add records
            </Link>
          </header>
          <section aria-label="Institution counts" className="admin-metrics">
            {metrics.map((item) => (
              <Link
                className={`${card} admin-metric`}
                href={item.href}
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value.toLocaleString()}</strong>
                <small>{item.hint}</small>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
          </section>
          <div className="admin-lower-grid">
            <section className={card}>
              <div className="admin-section-heading">
                <div>
                  <p className="admin-eyebrow">Common tasks</p>
                  <h2>Manage your institution</h2>
                </div>
              </div>
              <div className="admin-task-grid">
                {[
                  [
                    "Manage students",
                    "Search student accounts and membership status",
                    "/admin/students",
                  ],
                  [
                    "Manage faculty",
                    "Review faculty access and assignments",
                    "/admin/faculty",
                  ],
                  [
                    "Academic structure",
                    "Organize branches, courses, terms, and sections",
                    "/admin/departments",
                  ],
                  [
                    "Enrollments",
                    "Review students in course sections",
                    "/admin/enrollments",
                  ],
                  [
                    "Attendance",
                    "Inspect attendance sessions and records",
                    "/admin/attendance",
                  ],
                  [
                    "Invite a member",
                    "Create a student or faculty invitation",
                    "/admin/setup#invite",
                  ],
                ].map(([title, description, href]) => (
                  <Link href={href} className="admin-task" key={title}>
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                    <b aria-hidden="true">→</b>
                  </Link>
                ))}
              </div>
            </section>
            <section className={card}>
              <div className="admin-section-heading">
                <div>
                  <p className="admin-eyebrow">Latest changes</p>
                  <h2>Activity</h2>
                </div>
                <Link className="admin-text-link" href="/admin/activity">
                  View all
                </Link>
              </div>
              <div className="admin-activity-list">
                {audit.map((event) => (
                  <div className="admin-activity" key={event.id}>
                    <span className="admin-activity-dot" />
                    <div>
                      <strong>{event.action.replaceAll(".", " · ")}</strong>
                      <small>
                        {event.entity_type} ·{" "}
                        {formatInstitutionDateTime(
                          event.created_at,
                          institution?.timezone ?? "UTC",
                        )}
                      </small>
                    </div>
                  </div>
                ))}
                {!audit.length && (
                  <p className="admin-empty">No activity recorded yet.</p>
                )}
              </div>
            </section>
          </div>
          <p className="admin-footnote">
            All totals and records are scoped to this institution. Member counts
            exclude suspended memberships.
          </p>
        </main>
      </div>
    </div>
  );
}

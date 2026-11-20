import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AttendanceQr } from "@/components/attendance-qr";
import { LiveAttendanceList } from "@/components/live-attendance-list";
import { formatInstitutionDateTime } from "@/lib/config/format";
import {
  closeAttendanceSession,
  startAttendanceSession,
} from "@/lib/attendance/actions";
import { selectActiveSession } from "@/lib/attendance/dashboard";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";

export default async function FacultyDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMembership("faculty");
  const query = await searchParams;
  const [profileResult, institutionResult, assignmentsResult] =
    await Promise.all([
      member.supabase
        .from("profiles")
        .select("display_name")
        .eq("id", member.user_id)
        .maybeSingle(),
      member.supabase
        .from("institutions")
        .select("timezone")
        .eq("id", member.institution_id)
        .maybeSingle(),
      member.supabase
        .from("section_faculty")
        .select("section_id")
        .eq("institution_id", member.institution_id)
        .eq("faculty_user_id", member.user_id),
    ]);
  const profile = requireSupabaseData(profileResult, "faculty profile");
  const institution = requireSupabaseData(
    institutionResult,
    "institution details",
  );
  const assignments = requireSupabaseData(
    assignmentsResult,
    "faculty assignment list",
  );
  const sectionIds = (assignments ?? []).map((row) => row.section_id);
  const sections = sectionIds.length
    ? requireSupabaseData(
        await member.supabase
          .from("course_sections")
          .select("id,course_id,term_id,section_code")
          .in("id", sectionIds),
        "assigned section list",
      )
    : [];
  const courseIds = [...new Set((sections ?? []).map((row) => row.course_id))];
  const termIds = [...new Set((sections ?? []).map((row) => row.term_id))];
  const nowIso = new Date().toISOString();
  const [coursesResult, termsResult, enrollmentsResult, openSessionsResult] =
    await Promise.all([
      courseIds.length
        ? member.supabase
            .from("courses")
            .select("id,code,title")
            .in("id", courseIds)
        : Promise.resolve({ data: [], error: null }),
      termIds.length
        ? member.supabase
            .from("academic_terms")
            .select("id,name")
            .in("id", termIds)
        : Promise.resolve({ data: [], error: null }),
      sectionIds.length
        ? member.supabase
            .from("enrollments")
            .select("section_id,student_user_id")
            .in("section_id", sectionIds)
            .eq("status", "active")
        : Promise.resolve({ data: [], error: null }),
      sectionIds.length
        ? member.supabase
            .from("attendance_sessions")
            .select("id,section_id,status,expires_at,starts_at")
            .in("section_id", sectionIds)
            .eq("status", "open")
            .gt("expires_at", nowIso)
            .order("starts_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
  const courses = requireSupabaseData(coursesResult, "assigned course list");
  const terms = requireSupabaseData(termsResult, "assigned term list");
  const enrollments = requireSupabaseData(
    enrollmentsResult,
    "section enrollment list",
  );
  const openSessions = requireSupabaseData(
    openSessionsResult,
    "active attendance session list",
  );
  const courseMap = new Map((courses ?? []).map((row) => [row.id, row]));
  const termMap = new Map((terms ?? []).map((row) => [row.id, row.name]));
  const openSessionBySection = new Map(
    (openSessions ?? []).map((row) => [row.section_id, row]),
  );
  const selectedId = typeof query.session === "string" ? query.session : "";
  const activeSession = selectActiveSession(openSessions ?? [], selectedId);
  const selectedSection = activeSession
    ? (sections ?? []).find((row) => row.id === activeSession.section_id)
    : undefined;
  const selectedCourse = selectedSection
    ? courseMap.get(selectedSection.course_id)
    : undefined;
  const studentsPerSection = new Map<string, number>();
  for (const item of enrollments ?? [])
    studentsPerSection.set(
      item.section_id,
      (studentsPerSection.get(item.section_id) ?? 0) + 1,
    );
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <>
      <AppHeader
        role="faculty"
        name={profile?.display_name ?? "Faculty"}
        active="sections"
      />
      <main className="shell py-9 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Faculty workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Your teaching day
            </h1>
            <p className="mt-2 text-sm text-[#b4b4b4]">
              Start a secure attendance session or review a class roster.
            </p>
          </div>
          <span className="badge neutral">
            {sections?.length ?? 0} assigned sections
          </span>
        </div>
        {error && (
          <div className="error-box mt-6">
            The action could not be completed. Refresh and try again.
          </div>
        )}
        {query.closed && (
          <div
            className="mt-6 rounded-lg border border-[#1f4b37] bg-[#102b1e] p-3 text-sm text-[#3ecf8e]"
            role="status"
          >
            Session closed. Any other active session is ready below.
          </div>
        )}
        <section
          className="mt-7 grid gap-3 sm:grid-cols-3"
          aria-label="Teaching overview"
        >
          <div className="surface p-4 sm:p-5">
            <p className="eyebrow">Assigned sections</p>
            <p className="mt-3 text-2xl font-bold">{sections?.length ?? 0}</p>
            <p className="mt-1 text-xs text-[#b4b4b4]">Available to manage</p>
          </div>
          <div className="surface p-4 sm:p-5">
            <p className="eyebrow">Live sessions</p>
            <p className="mt-3 text-2xl font-bold">
              {openSessions?.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-[#b4b4b4]">
              Open attendance windows
            </p>
          </div>
          <div className="surface p-4 sm:p-5">
            <p className="eyebrow">Section enrollments</p>
            <p className="mt-3 text-2xl font-bold">
              {[...studentsPerSection.values()].reduce(
                (total, count) => total + count,
                0,
              )}
            </p>
            <p className="mt-1 text-xs text-[#b4b4b4]">
              Across assigned sections
            </p>
          </div>
        </section>
        {activeSession && selectedSection && (
          <section id="attendance" className="surface mt-8 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2e2e2e] p-5 sm:p-6">
              <div>
                <p className="eyebrow">Live attendance session</p>
                <h2 className="mt-2 text-xl font-bold">
                  {selectedCourse?.title ?? "Class session"}{" "}
                  <span className="text-[#b4b4b4]">
                    · {selectedSection.section_code}
                  </span>
                </h2>
                <p className="mt-2 text-xs text-[#b4b4b4]">
                  Session ends{" "}
                  {formatInstitutionDateTime(
                    activeSession.expires_at,
                    institution?.timezone ?? "UTC",
                  )}
                </p>
              </div>
              <form action={closeAttendanceSession}>
                <input
                  type="hidden"
                  name="session_id"
                  value={activeSession.id}
                />
                <button className="button secondary" type="submit">
                  Close session
                </button>
              </form>
            </div>
            {(openSessions ?? []).length > 1 && (
              <nav
                className="flex flex-wrap items-center gap-2 border-b border-[#2e2e2e] px-5 py-3 sm:px-6"
                aria-label="Switch active attendance session"
              >
                <span className="mr-1 text-[11px] text-[#b4b4b4]">
                  Active sessions
                </span>
                {(openSessions ?? []).map((session) => {
                  const section = (sections ?? []).find(
                    (item) => item.id === session.section_id,
                  );
                  const course = section
                    ? courseMap.get(section.course_id)
                    : undefined;
                  if (!section) return null;
                  return (
                    <Link
                      key={session.id}
                      className={`badge neutral transition-colors hover:border-[#3ecf8e] hover:text-[#3ecf8e] ${
                        session.id === activeSession.id
                          ? "!border-[#1f4b37] !bg-[#102b1e] !text-[#3ecf8e]"
                          : ""
                      }`}
                      href={`/faculty?session=${session.id}`}
                      aria-current={
                        session.id === activeSession.id ? "page" : undefined
                      }
                    >
                      {course?.code ?? "Section"} · {section.section_code}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[280px_1fr]">
              <div className="text-center">
                <AttendanceQr sessionId={activeSession.id} />
                <p className="mx-auto mt-3 max-w-[240px] text-[10px] leading-5 text-[#b4b4b4]">
                  Ask students to scan this rotating code with their phone
                  camera. Each student can check in once.
                </p>
              </div>
              <LiveAttendanceList
                sessionId={activeSession.id}
                timezone={institution?.timezone ?? "UTC"}
              />
            </div>
          </section>
        )}
        <section id="sections" className="mt-9 scroll-mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold">Assigned sections</h2>
              <p className="mt-1 text-xs text-[#b4b4b4]">
                Attendance sessions are limited to your current assignments.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sections?.map((section) => {
              const course = courseMap.get(section.course_id);
              const openSession = openSessionBySection.get(section.id);
              return (
                <article key={section.id} className="surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#242424] text-[10px] font-extrabold text-[#3ecf8e]">
                        {course?.code.slice(0, 3) ?? "CLS"}
                      </span>
                      <div>
                        <h3 className="font-bold">
                          {course?.title ?? "Course"}
                        </h3>
                        <p className="mt-1 text-[11px] text-[#b4b4b4]">
                          {course?.code} · Section {section.section_code}
                        </p>
                      </div>
                    </div>
                    <span className="badge neutral">
                      {studentsPerSection.get(section.id) ?? 0} students
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#2e2e2e] pt-4">
                    <p className="text-[10px] text-[#b4b4b4]">
                      {termMap.get(section.term_id) ?? "Academic term"}
                    </p>
                    {openSession ? (
                      <Link
                        className="button secondary !min-h-9 !px-3 !text-[11px]"
                        href={`/faculty?session=${openSession.id}`}
                      >
                        {activeSession?.id === openSession.id
                          ? "Session active"
                          : "View live QR →"}
                      </Link>
                    ) : (
                      <form action={startAttendanceSession}>
                        <input
                          type="hidden"
                          name="section_id"
                          value={section.id}
                        />
                        <button
                          className="button !min-h-9 !px-3 !text-[11px]"
                          type="submit"
                        >
                          Start attendance <span aria-hidden="true">→</span>
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
            {!sections?.length && (
              <div className="surface col-span-full px-6 py-12 text-center">
                <p className="font-bold">No sections assigned yet</p>
                <p className="mt-2 text-xs text-[#b4b4b4]">
                  Ask an institution administrator to assign your faculty
                  account to a section.
                </p>
              </div>
            )}
          </div>
        </section>
        <p className="mt-8 text-[10px] text-[#898989]">
          QR check-in confirms a student account and enrollment; it cannot
          prevent real-time code sharing.
        </p>
      </main>
    </>
  );
}

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { filterAttendanceByCourse } from "@/lib/attendance/dashboard";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";

export default async function StudentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMembership("student");
  const [query, profileResult, institutionResult, recordsResult] =
    await Promise.all([
      searchParams,
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
        .from("attendance_records")
        .select("session_id,recorded_at,status")
        .eq("student_user_id", member.user_id)
        .order("recorded_at", { ascending: false })
        .limit(200),
    ]);
  const profile = requireSupabaseData(profileResult, "student profile");
  const institution = requireSupabaseData(
    institutionResult,
    "institution details",
  );
  const records = requireSupabaseData(
    recordsResult,
    "student attendance history",
  );
  const sessionIds = [...new Set((records ?? []).map((row) => row.session_id))];
  const sessions = sessionIds.length
    ? requireSupabaseData(
        await member.supabase
          .from("attendance_sessions")
          .select("id,section_id,starts_at")
          .in("id", sessionIds),
        "attendance history session list",
      )
    : [];
  const sectionIds = [
    ...new Set((sessions ?? []).map((row) => row.section_id)),
  ];
  const sections = sectionIds.length
    ? requireSupabaseData(
        await member.supabase
          .from("course_sections")
          .select("id,course_id,section_code")
          .in("id", sectionIds),
        "attendance history section list",
      )
    : [];
  const courseIds = [...new Set((sections ?? []).map((row) => row.course_id))];
  const courses = courseIds.length
    ? requireSupabaseData(
        await member.supabase
          .from("courses")
          .select("id,code,title")
          .in("id", courseIds),
        "attendance history course list",
      )
    : [];
  const sessionMap = new Map((sessions ?? []).map((row) => [row.id, row]));
  const sectionMap = new Map((sections ?? []).map((row) => [row.id, row]));
  const courseMap = new Map((courses ?? []).map((row) => [row.id, row]));
  const requestedCourseId =
    typeof query.course === "string" ? query.course : "";
  const selectedCourseId = courseMap.has(requestedCourseId)
    ? requestedCourseId
    : "";
  const visibleRecords = filterAttendanceByCourse(
    records ?? [],
    sessionMap,
    sectionMap,
    selectedCourseId,
  );
  return (
    <>
      <AppHeader
        role="student"
        name={profile?.display_name ?? "Student"}
        active="history"
      />
      <main className="shell py-10">
        <Link href="/student" className="text-xs font-semibold text-[#3ecf8e]">
          ← Student overview
        </Link>
        <div className="mt-5">
          <p className="eyebrow">Your records</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Attendance history
          </h1>
          <p className="mt-2 text-sm text-[#b4b4b4]">
            A private record of the sessions you attended.
          </p>
        </div>
        <section className="surface mt-7 overflow-hidden">
          <form
            action="/student/history"
            className="flex flex-col gap-3 border-b border-[#2e2e2e] p-4 sm:flex-row sm:items-end sm:justify-between sm:px-5"
          >
            <label className="grid gap-2 text-xs text-[#b4b4b4] sm:min-w-64">
              Filter by course
              <select
                className="input"
                name="course"
                defaultValue={selectedCourseId}
              >
                <option value="">All courses</option>
                {[...(courses ?? [])]
                  .sort((left, right) => left.code.localeCompare(right.code))
                  .map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.title}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <button className="button" type="submit">
                Apply filter
              </button>
              {selectedCourseId && (
                <Link
                  className="text-xs font-semibold text-[#b4b4b4] hover:text-white"
                  href="/student/history"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
          <div className="table-wrap">
            <table className="min-w-[600px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Date and time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const session = sessionMap.get(record.session_id);
                  const section = session
                    ? sectionMap.get(session.section_id)
                    : undefined;
                  const course = section
                    ? courseMap.get(section.course_id)
                    : undefined;
                  return (
                    <tr key={record.session_id}>
                      <td>
                        <b>{course?.title ?? "Course"}</b>
                        <span className="ml-2 text-[10px] text-[#b4b4b4]">
                          {course?.code}
                        </span>
                      </td>
                      <td>{section?.section_code ?? "—"}</td>
                      <td>
                        {formatInstitutionDateTime(
                          record.recorded_at,
                          institution?.timezone ?? "UTC",
                        )}
                      </td>
                      <td>
                        <span className="badge">Present</span>
                      </td>
                    </tr>
                  );
                })}
                {!visibleRecords.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-16 text-center text-sm text-[#b4b4b4]"
                    >
                      {selectedCourseId
                        ? "No attendance records for this course yet."
                        : "No attendance records yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <p className="mt-4 text-[10px] text-[#898989]">
          {selectedCourseId
            ? `Showing ${visibleRecords.length} matching records among the latest 200 attendance events.`
            : "Showing the most recent 200 attendance events."}
        </p>
      </main>
    </>
  );
}

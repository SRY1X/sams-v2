import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";

export default async function StudentHistoryPage() {
  const member = await requireMembership("student");
  const [profileResult, institutionResult, recordsResult] = await Promise.all([
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
  return (
    <>
      <AppHeader role="student" name={profile?.display_name ?? "Student"} />
      <main className="shell py-10">
        <Link href="/student" className="text-xs font-semibold text-[#ff8833]">
          ← Student overview
        </Link>
        <div className="mt-5">
          <p className="eyebrow">Your records</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Attendance history
          </h1>
          <p className="mt-2 text-sm text-[#a1a1a1]">
            A private record of the sessions you attended.
          </p>
        </div>
        <section className="surface mt-7 overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Date and time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records?.map((record) => {
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
                        <span className="ml-2 text-[10px] text-[#a1a1a1]">
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
                {!records?.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-16 text-center text-sm text-[#a1a1a1]"
                    >
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <p className="mt-4 text-[10px] text-[#737373]">
          Showing the most recent 200 records.
        </p>
      </main>
    </>
  );
}

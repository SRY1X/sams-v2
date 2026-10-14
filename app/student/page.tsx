import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";

export default async function StudentDashboard() {
  const member = await requireMembership("student");
  const { data: profile } = await member.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", member.user_id)
    .maybeSingle();
  const { data: institution } = await member.supabase
    .from("institutions")
    .select("timezone")
    .eq("id", member.institution_id)
    .maybeSingle();
  const { data: enrollments } = await member.supabase
    .from("enrollments")
    .select("section_id,status")
    .eq("student_user_id", member.user_id)
    .eq("status", "active");
  const sectionIds = (enrollments ?? []).map((row) => row.section_id);
  const { data: sections } = sectionIds.length
    ? await member.supabase
        .from("course_sections")
        .select("id,course_id,term_id,section_code")
        .in("id", sectionIds)
    : { data: [] };
  const courseIds = [...new Set((sections ?? []).map((row) => row.course_id))];
  const termIds = [...new Set((sections ?? []).map((row) => row.term_id))];
  const [{ data: courses }, { data: terms }, { data: records }] =
    await Promise.all([
      courseIds.length
        ? member.supabase
            .from("courses")
            .select("id,code,title")
            .in("id", courseIds)
        : Promise.resolve({ data: [] }),
      termIds.length
        ? member.supabase
            .from("academic_terms")
            .select("id,name")
            .in("id", termIds)
        : Promise.resolve({ data: [] }),
      member.supabase
        .from("attendance_records")
        .select("session_id,recorded_at,status")
        .eq("student_user_id", member.user_id)
        .order("recorded_at", { ascending: false })
        .limit(8),
    ]);
  const sessionIds = [...new Set((records ?? []).map((row) => row.session_id))];
  const { data: sessions } = sessionIds.length
    ? await member.supabase
        .from("attendance_sessions")
        .select("id,section_id,starts_at")
        .in("id", sessionIds)
    : { data: [] };
  const historySectionIds = [
    ...new Set((sessions ?? []).map((row) => row.section_id)),
  ];
  const historySections = historySectionIds.length
    ? await member.supabase
        .from("course_sections")
        .select("id,course_id,section_code")
        .in("id", historySectionIds)
    : { data: [] };
  const historyCourseIds = [
    ...new Set((historySections.data ?? []).map((row) => row.course_id)),
  ];
  const { data: historyCourses } = historyCourseIds.length
    ? await member.supabase
        .from("courses")
        .select("id,code,title")
        .in("id", historyCourseIds)
    : { data: [] };
  const courseById = new Map(
    [...(courses ?? []), ...(historyCourses ?? [])].map((row) => [row.id, row]),
  );
  const termById = new Map((terms ?? []).map((row) => [row.id, row.name]));
  const sessionById = new Map((sessions ?? []).map((row) => [row.id, row]));
  const historySectionById = new Map(
    (historySections.data ?? []).map((row) => [row.id, row]),
  );
  const sectionCards = sections ?? [];
  const presentCount = records?.length ?? 0;

  return (
    <>
      <AppHeader role="student" name={profile?.display_name ?? "Student"} />
      <main className="shell py-9 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Good day, {profile?.display_name?.split(" ")[0] ?? "there"}.
            </h1>
            <p className="mt-2 text-sm text-[#a1a1a1]">
              Your classes and attendance, all in one place.
            </p>
          </div>
          <Link className="button" href="/student/history">
            View attendance history <span aria-hidden="true">→</span>
          </Link>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="surface p-5">
            <p className="eyebrow">Enrolled sections</p>
            <p className="mt-3 text-3xl font-bold">
              {sectionCards.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-[#a1a1a1]">
              Current course sections
            </p>
          </div>
          <div className="surface p-5">
            <p className="eyebrow">Recent check-ins</p>
            <p className="mt-3 text-3xl font-bold">
              {presentCount.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-[#a1a1a1]">
              Most recent attendance records
            </p>
          </div>
          <div className="surface flex items-center gap-3 bg-[#142019] p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-[#171717] text-lg text-[#ff8833]">
              ⌗
            </span>
            <div>
              <p className="text-sm font-bold">Ready to check in?</p>
              <p className="mt-1 text-xs text-[#a1a1a1]">
                Scan your instructor’s active QR code.
              </p>
            </div>
          </div>
        </section>
        <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_.85fr]">
          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#262626] px-5 py-4">
              <div>
                <h2 className="font-bold">Your sections</h2>
                <p className="mt-1 text-[11px] text-[#a1a1a1]">
                  Courses you are currently enrolled in
                </p>
              </div>
              <span className="badge neutral">
                {sectionCards.length} sections
              </span>
            </div>
            {sectionCards.length ? (
              <div className="divide-y divide-[#262626]">
                {sectionCards.map((section) => {
                  const course = courseById.get(section.course_id);
                  return (
                    <div
                      key={section.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-[#171717] text-[10px] font-extrabold text-[#7cc9a0]">
                        {course?.code.slice(0, 3) ?? "CLS"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {course?.title ?? "Course"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#a1a1a1]">
                          {course?.code ?? ""} · Section {section.section_code}{" "}
                          · {termById.get(section.term_id) ?? "Academic term"}
                        </p>
                      </div>
                      <span className="badge">Enrolled</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold">No sections yet</p>
                <p className="mt-2 text-xs text-[#a1a1a1]">
                  Your institution administrator will enroll you in your
                  courses.
                </p>
              </div>
            )}
          </section>
          <section className="surface overflow-hidden">
            <div className="border-b border-[#262626] px-5 py-4">
              <h2 className="font-bold">Recent attendance</h2>
              <p className="mt-1 text-[11px] text-[#a1a1a1]">
                Your latest check-ins
              </p>
            </div>
            {records?.length ? (
              <div className="divide-y divide-[#262626]">
                {records.slice(0, 5).map((record) => {
                  const session = sessionById.get(record.session_id);
                  const section = session
                    ? historySectionById.get(session.section_id)
                    : undefined;
                  const course = section
                    ? courseById.get(section.course_id)
                    : undefined;
                  return (
                    <div
                      key={record.session_id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div>
                        <p className="text-xs font-bold">
                          {course?.title ?? "Class session"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a1a1a1]">
                          {formatInstitutionDateTime(
                            record.recorded_at,
                            institution?.timezone ?? "UTC",
                          )}
                        </p>
                      </div>
                      <span className="badge">Present</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-xs text-[#a1a1a1]">
                Your attendance history will appear here.
              </div>
            )}
            <div className="border-t border-[#262626] px-5 py-3">
              <Link
                className="text-xs font-bold text-[#ff8833]"
                href="/student/history"
              >
                Open full history →
              </Link>
            </div>
          </section>
        </div>
        <p className="mt-8 text-[10px] text-[#737373]">
          Attendance records are visible only to you and authorized staff for
          your enrolled sections.
        </p>
      </main>
    </>
  );
}

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";

export default async function StudentDashboard() {
  const member = await requireMembership("student");
  const [profileResult, institutionResult, enrollmentsResult, recordsResult] =
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
        .from("enrollments")
        .select(
          `section_id, section:course_sections!enrollments_section_id_institution_id_fkey!inner(
          id,term_id,section_code,
          course:courses!course_sections_course_id_institution_id_fkey(id,code,title),
          term:academic_terms!course_sections_term_id_institution_id_fkey(id,name)
        )`,
        )
        .eq("student_user_id", member.user_id)
        .eq("status", "active"),
      member.supabase
        .from("attendance_records")
        .select(
          `session_id,recorded_at,status,
          session:attendance_sessions!attendance_records_session_id_institution_id_fkey(
            starts_at,
            section:course_sections!attendance_sessions_section_id_institution_id_fkey(
              section_code,
              course:courses!course_sections_course_id_institution_id_fkey(id,code,title)
            )
          )`,
        )
        .eq("student_user_id", member.user_id)
        .order("recorded_at", { ascending: false })
        .limit(8),
    ]);
  const profile = requireSupabaseData(profileResult, "student profile");
  const institution = requireSupabaseData(
    institutionResult,
    "institution details",
  );
  const enrollments = requireSupabaseData(
    enrollmentsResult,
    "student enrollment list",
  );
  const records = requireSupabaseData(recordsResult, "student attendance list");
  const sectionCards = (enrollments ?? []).flatMap((row) =>
    row.section ? [row.section] : [],
  );
  const presentCount = records?.length ?? 0;

  return (
    <>
      <AppHeader
        role="student"
        name={profile?.display_name ?? "Student"}
        active="overview"
      />
      <main className="shell py-9 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Good day, {profile?.display_name?.split(" ")[0] ?? "there"}.
            </h1>
            <p className="mt-2 text-sm text-[#b4b4b4]">
              Your classes and attendance, all in one place.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link className="button w-full sm:w-auto" href="/student/scan">
              Scan attendance QR <span aria-hidden="true">→</span>
            </Link>
            <Link
              className="button secondary w-full sm:w-auto"
              href="/student/history"
            >
              View history
            </Link>
          </div>
        </div>
        <section className="mt-7 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="surface p-5">
            <p className="eyebrow">Enrolled sections</p>
            <p className="mt-3 text-3xl font-bold">
              {sectionCards.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-[#b4b4b4]">
              Current course sections
            </p>
          </div>
          <div className="surface p-5">
            <p className="eyebrow">Recent records</p>
            <p className="mt-3 text-3xl font-bold">
              {presentCount.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-[#b4b4b4]">
              Your latest attendance events
            </p>
          </div>
        </section>
        <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_.85fr]">
          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] px-5 py-4">
              <div>
                <h2 className="font-bold">Your sections</h2>
                <p className="mt-1 text-[11px] text-[#b4b4b4]">
                  Courses you are currently enrolled in
                </p>
              </div>
              <span className="badge neutral">
                {sectionCards.length}{" "}
                {sectionCards.length === 1 ? "section" : "sections"}
              </span>
            </div>
            {sectionCards.length ? (
              <div className="divide-y divide-[#2e2e2e]">
                {sectionCards.map((section) => {
                  const course = section.course;
                  return (
                    <div
                      key={section.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-[#242424] text-[10px] font-extrabold text-[#3ecf8e]">
                        {course?.code.slice(0, 3) ?? "CLS"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {course?.title ?? "Course"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#b4b4b4]">
                          {course?.code ?? ""} · Section {section.section_code}{" "}
                          · {section.term?.name ?? "Academic term"}
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
                <p className="mt-2 text-xs text-[#b4b4b4]">
                  Your institution administrator will enroll you in your
                  courses.
                </p>
              </div>
            )}
          </section>
          <section className="surface overflow-hidden">
            <div className="border-b border-[#2e2e2e] px-5 py-4">
              <h2 className="font-bold">Recent attendance</h2>
              <p className="mt-1 text-[11px] text-[#b4b4b4]">
                Your latest check-ins
              </p>
            </div>
            {records?.length ? (
              <div className="divide-y divide-[#2e2e2e]">
                {records.slice(0, 5).map((record) => {
                  const course = record.session?.section?.course;
                  return (
                    <div
                      key={record.session_id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div>
                        <p className="text-xs font-bold">
                          {course?.title ?? "Class session"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#b4b4b4]">
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
              <div className="px-5 py-12 text-center text-xs text-[#b4b4b4]">
                Your attendance history will appear here.
              </div>
            )}
            <div className="border-t border-[#2e2e2e] px-5 py-3">
              <Link
                className="text-xs font-bold text-[#3ecf8e]"
                href="/student/history"
              >
                Open full history →
              </Link>
            </div>
          </section>
        </div>
        <p className="mt-8 text-[10px] text-[#898989]">
          Attendance records are visible only to you and authorized staff for
          your enrolled sections.
        </p>
      </main>
    </>
  );
}

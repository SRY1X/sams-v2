import Link from "next/link";
import { AttendanceScanner } from "@/components/attendance-scanner";
import { AppHeader } from "@/components/app-header";
import { requireMembership } from "@/lib/auth/session";
import { requireSupabaseData } from "@/lib/supabase/errors";
import { isAttendanceDiagnosticsEnabled } from "@/lib/attendance/performance";

export default async function StudentScanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMembership("student");
  const query = await searchParams;
  const diagnosticsEnabled = isAttendanceDiagnosticsEnabled(query.diagnostics);
  const profile = requireSupabaseData(
    await member.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", member.user_id)
      .maybeSingle(),
    "student profile",
  );

  return (
    <>
      <AppHeader
        role="student"
        name={profile?.display_name ?? "Student"}
        active="scan"
      />
      <main className="shell max-w-2xl py-9 sm:py-12">
        <Link
          className="text-sm font-semibold text-[#b4b4b4] hover:text-white"
          href="/student"
        >
          ← Student dashboard
        </Link>
        <p className="eyebrow mt-8">Attendance check-in</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Scan a class QR code
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#b4b4b4]">
          Point your camera at the active QR code shown by your instructor. Keep
          this page open while the code is scanned.
        </p>
        <div className="mt-5 rounded-xl border border-[#2e2e2e] bg-[#121212] p-4 text-xs leading-5 text-[#b4b4b4]">
          <p className="font-semibold text-[#fafafa]">Before you scan</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Open SAMS over HTTPS and allow camera access when prompted.</li>
            <li>Keep the QR code on your instructor’s screen in view.</li>
            <li>
              Your camera video stays on this device; SAMS submits only the
              scanned code.
            </li>
          </ul>
        </div>
        <AttendanceScanner diagnosticsEnabled={diagnosticsEnabled} />
      </main>
    </>
  );
}

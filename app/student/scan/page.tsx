import Link from "next/link";
import { AttendanceScanner } from "@/components/attendance-scanner";
import { AppHeader } from "@/components/app-header";
import { requireMembership } from "@/lib/auth/session";

export default async function StudentScanPage() {
  const member = await requireMembership("student");
  const { data: profile } = await member.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", member.user_id)
    .maybeSingle();

  return (
    <>
      <AppHeader role="student" name={profile?.display_name ?? "Student"} />
      <main className="shell max-w-2xl py-9 sm:py-12">
        <Link
          className="text-sm font-semibold text-[#a1a1a1] hover:text-white"
          href="/student"
        >
          ← Student dashboard
        </Link>
        <p className="eyebrow mt-8">Attendance check-in</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Scan a class QR code
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#a1a1a1]">
          Point your camera at the active QR code shown by your instructor. Keep
          this page open while the code is scanned.
        </p>
        <AttendanceScanner />
      </main>
    </>
  );
}

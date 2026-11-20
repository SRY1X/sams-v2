import { AttendanceClaim } from "@/components/attendance-claim";
import { isAttendanceDiagnosticsEnabled } from "@/lib/attendance/performance";

export default async function AttendanceClaimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const diagnosticsEnabled = isAttendanceDiagnosticsEnabled(query.diagnostics);
  return <AttendanceClaim diagnosticsEnabled={diagnosticsEnabled} />;
}

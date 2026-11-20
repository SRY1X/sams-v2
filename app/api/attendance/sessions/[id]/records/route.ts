import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { formatAttendanceServerTiming } from "@/lib/attendance/performance";

/** Returns a session roster snapshot when the database authorizes the authenticated user. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestStartedAt = performance.now();
  let authDuration = 0;
  let databaseDuration = 0;
  const respond = (
    body: object,
    status: number,
    headers: Record<string, string> = {},
  ) =>
    NextResponse.json(body, {
      status,
      headers: {
        ...headers,
        "Server-Timing": formatAttendanceServerTiming({
          authMs: authDuration,
          dbMs: databaseDuration,
          totalMs: performance.now() - requestStartedAt,
        }),
      },
    });
  const id = (await params).id;
  if (!z.uuid().safeParse(id).success)
    return respond({ error: "not_available" }, 404);
  const authStartedAt = performance.now();
  const identity = await getIdentity();
  authDuration = performance.now() - authStartedAt;
  if (!identity) return respond({ error: "not_available" }, 404);
  const databaseStartedAt = performance.now();
  const { data: snapshots, error } = await identity.supabase.rpc(
    "get_attendance_session_snapshot",
    { p_session_id: id },
  );
  databaseDuration = performance.now() - databaseStartedAt;
  const snapshot = snapshots?.[0];
  if (error?.code === "42501") return respond({ error: "not_available" }, 404);
  if (error)
    return respond({ error: "temporarily_unavailable" }, 503, {
      "Cache-Control": "no-store",
    });
  if (!snapshot) return respond({ error: "not_available" }, 404);
  const records = Array.isArray(snapshot.records) ? snapshot.records : [];
  return respond(
    {
      timezone: snapshot.timezone,
      records,
    },
    200,
    { "Cache-Control": "no-store, private", Pragma: "no-cache" },
  );
}

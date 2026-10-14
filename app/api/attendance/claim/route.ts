import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/server-env";
import { verifyAttendanceToken } from "@/lib/attendance/token";

const bodySchema = z.object({ token: z.string().min(20).max(1500) });

export async function POST(request: NextRequest) {
  const requestStartedAt = performance.now();
  let authDuration = 0;
  let databaseDuration = 0;
  const respond = (body: object, status: number) =>
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store, private",
        "Server-Timing": `auth;dur=${authDuration.toFixed(1)}, db;dur=${databaseDuration.toFixed(1)}, app;dur=${(performance.now() - requestStartedAt).toFixed(1)}`,
      },
    });

  const authStartedAt = performance.now();
  const identity = await getIdentity();
  authDuration = performance.now() - authStartedAt;
  if (!identity)
    return respond({ error: "Sign in to record attendance." }, 401);
  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2200)
      return respond({ error: "This QR code is invalid or expired." }, 400);
    payload = JSON.parse(raw);
  } catch {
    return respond({ error: "This QR code is invalid or expired." }, 400);
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success)
    return respond({ error: "This QR code is invalid or expired." }, 400);
  const { ATTENDANCE_TOKEN_SECRET } = getServerEnv();
  const claims = verifyAttendanceToken(
    parsed.data.token,
    ATTENDANCE_TOKEN_SECRET,
  );
  if (!claims)
    return respond({ error: "This QR code is invalid or expired." }, 400);

  const databaseStartedAt = performance.now();
  const { data, error } = await identity.supabase.rpc("record_attendance", {
    p_session_id: claims.sid,
  });
  databaseDuration = performance.now() - databaseStartedAt;
  if (error) {
    const denied = error.code === "42501";
    return respond(
      {
        error: denied
          ? "You are not enrolled in this class."
          : "This attendance session is no longer active.",
      },
      denied ? 403 : 400,
    );
  }
  return respond(
    { status: data === "already_recorded" ? "already_recorded" : "recorded" },
    200,
  );
}

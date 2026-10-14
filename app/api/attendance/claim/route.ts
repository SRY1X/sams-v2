import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/server-env";
import { verifyAttendanceToken } from "@/lib/attendance/token";

const bodySchema = z.object({ token: z.string().min(20).max(1500) });

export async function POST(request: NextRequest) {
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json(
      { error: "Sign in to record attendance." },
      { status: 401 },
    );
  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2200)
      return NextResponse.json(
        { error: "This QR code is invalid or expired." },
        { status: 400 },
      );
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "This QR code is invalid or expired." },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(
      { error: "This QR code is invalid or expired." },
      { status: 400 },
    );
  const { ATTENDANCE_TOKEN_SECRET } = getServerEnv();
  const claims = verifyAttendanceToken(
    parsed.data.token,
    ATTENDANCE_TOKEN_SECRET,
  );
  if (!claims)
    return NextResponse.json(
      { error: "This QR code is invalid or expired." },
      { status: 400 },
    );

  const { data, error } = await identity.supabase.rpc("record_attendance", {
    p_session_id: claims.sid,
  });
  if (error) {
    const denied = error.code === "42501";
    return NextResponse.json(
      {
        error: denied
          ? "You are not enrolled in this class."
          : "This attendance session is no longer active.",
      },
      { status: denied ? 403 : 400 },
    );
  }
  return NextResponse.json(
    { status: data === "already_recorded" ? "already_recorded" : "recorded" },
    {
      headers: { "Cache-Control": "no-store, private" },
    },
  );
}

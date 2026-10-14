import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMembership } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/server-env";
import { issueAttendanceToken } from "@/lib/attendance/token";

const idSchema = z.uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const membership = await getMembership();
  if (!membership || !["faculty", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "not_available" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "not_available" }, { status: 404 });

  const { data: session } = await membership.supabase
    .from("attendance_sessions")
    .select("id,institution_id,section_id,status,expires_at")
    .eq("id", id)
    .maybeSingle();
  if (
    !session ||
    session.institution_id !== membership.institution_id ||
    session.status !== "open" ||
    Date.parse(session.expires_at) <= Date.now()
  ) {
    return NextResponse.json(
      { error: "not_available" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: allowed } = await membership.supabase.rpc(
    "can_manage_attendance_session",
    { p_session_id: id },
  );
  if (!allowed)
    return NextResponse.json(
      { error: "not_available" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );

  const { ATTENDANCE_TOKEN_SECRET } = getServerEnv();
  const { data: settingsRow } = await membership.supabase
    .from("institution_settings")
    .select("settings")
    .eq("institution_id", membership.institution_id)
    .maybeSingle();
  const settings = settingsRow?.settings as Record<string, unknown> | undefined;
  const ttl =
    typeof settings?.qr_token_ttl_seconds === "number"
      ? settings.qr_token_ttl_seconds
      : 40;
  const rotation =
    typeof settings?.qr_rotation_seconds === "number"
      ? settings.qr_rotation_seconds
      : 25;
  const token = issueAttendanceToken(id, ATTENDANCE_TOKEN_SECRET, ttl);
  const claimUrl = new URL("/attendance/claim", request.nextUrl.origin);
  claimUrl.hash = new URLSearchParams({ token }).toString();
  return NextResponse.json(
    {
      url: claimUrl.toString(),
      expiresAt: Math.min(
        Date.now() + ttl * 1000,
        Date.parse(session.expires_at),
      ),
      rotateAfterMs: Math.max(10, Math.min(rotation, 120)) * 1000,
    },
    {
      headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" },
    },
  );
}

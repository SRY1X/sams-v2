import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/server-env";
import { issueAttendanceToken } from "@/lib/attendance/token";
import {
  DEFAULT_QR_ROTATION_SECONDS,
  DEFAULT_QR_TOKEN_TTL_SECONDS,
} from "@/lib/attendance/constants";

const idSchema = z.uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getIdentity();
  if (!identity) {
    return NextResponse.json(
      { error: "not_available" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "not_available" }, { status: 404 });

  const { data: contexts, error } = await identity.supabase.rpc(
    "get_attendance_qr_context",
    { p_session_id: id },
  );
  const context = contexts?.[0];
  if (error || !context || Date.parse(context.expires_at) <= Date.now())
    return NextResponse.json(
      { error: "not_available" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );

  const { ATTENDANCE_TOKEN_SECRET } = getServerEnv();
  const ttl = context.qr_token_ttl_seconds ?? DEFAULT_QR_TOKEN_TTL_SECONDS;
  const rotation = context.qr_rotation_seconds ?? DEFAULT_QR_ROTATION_SECONDS;
  const issuedAt = Date.now();
  const token = issueAttendanceToken(
    id,
    ATTENDANCE_TOKEN_SECRET,
    ttl,
    issuedAt,
  );
  const tokenExpiresAt = (Math.floor(issuedAt / 1000) + ttl) * 1000;
  const claimUrl = new URL("/attendance/claim", request.nextUrl.origin);
  claimUrl.hash = new URLSearchParams({ token }).toString();
  return NextResponse.json(
    {
      url: claimUrl.toString(),
      expiresAt: Math.min(tokenExpiresAt, Date.parse(context.expires_at)),
      rotateAfterMs: rotation * 1000,
    },
    {
      headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" },
    },
  );
}

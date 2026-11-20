import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";
import { getServerEnv, getSiteOrigin } from "@/lib/config/server-env";
import { issueAttendanceToken } from "@/lib/attendance/token";
import {
  DEFAULT_QR_ROTATION_SECONDS,
  DEFAULT_QR_TOKEN_TTL_SECONDS,
} from "@/lib/attendance/constants";
import {
  buildAttendanceClaimUrl,
  formatAttendanceServerTiming,
} from "@/lib/attendance/performance";

const idSchema = z.uuid();

/** Issues a rotating QR claim URL for an active session the authenticated user may manage. */
export async function GET(
  request: NextRequest,
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
  const diagnosticsEnabled =
    request.nextUrl.searchParams.get("diagnostics") === "1";
  const authStartedAt = performance.now();
  const identity = await getIdentity();
  authDuration = performance.now() - authStartedAt;
  if (!identity) {
    return respond({ error: "not_available" }, 404, {
      "Cache-Control": "no-store",
    });
  }
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return respond({ error: "not_available" }, 404);

  const databaseStartedAt = performance.now();
  const { data: contexts, error } = await identity.supabase.rpc(
    "get_attendance_qr_context",
    { p_session_id: id },
  );
  databaseDuration = performance.now() - databaseStartedAt;
  const context = contexts?.[0];
  const sessionExpiresAt = context ? Date.parse(context.expires_at) : NaN;
  if (error?.code === "42501")
    return respond({ error: "not_available" }, 404, {
      "Cache-Control": "no-store",
    });
  if (error)
    return respond({ error: "temporarily_unavailable" }, 503, {
      "Cache-Control": "no-store",
    });
  if (
    !context ||
    !Number.isFinite(sessionExpiresAt) ||
    sessionExpiresAt <= Date.now()
  )
    return respond({ error: "not_available" }, 404, {
      "Cache-Control": "no-store",
    });

  let attendanceTokenSecret: string;
  let siteOrigin: string;
  try {
    attendanceTokenSecret = getServerEnv().ATTENDANCE_TOKEN_SECRET;
    siteOrigin = getSiteOrigin();
  } catch {
    return respond({ error: "not_available" }, 503, {
      "Cache-Control": "no-store",
    });
  }
  const ttl = context.qr_token_ttl_seconds ?? DEFAULT_QR_TOKEN_TTL_SECONDS;
  const rotation = context.qr_rotation_seconds ?? DEFAULT_QR_ROTATION_SECONDS;
  const issuedAt = Date.now();
  const token = issueAttendanceToken(id, attendanceTokenSecret, ttl, issuedAt);
  const tokenExpiresAt = (Math.floor(issuedAt / 1000) + ttl) * 1000;
  const claimUrl = buildAttendanceClaimUrl(
    siteOrigin,
    token,
    diagnosticsEnabled,
  );
  return respond(
    {
      url: claimUrl,
      expiresAt: Math.min(tokenExpiresAt, sessionExpiresAt),
      rotateAfterMs: rotation * 1000,
    },
    200,
    {
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
    },
  );
}

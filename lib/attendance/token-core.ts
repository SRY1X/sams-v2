import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  ATTENDANCE_TOKEN_CLOCK_SKEW_SECONDS,
  DEFAULT_QR_TOKEN_TTL_SECONDS,
} from "./constants";

type Claims = { v: 1; sid: string; iat: number; exp: number; nonce: string };
function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function issueAttendanceToken(
  sessionId: string,
  secret: string,
  ttlSeconds = DEFAULT_QR_TOKEN_TTL_SECONDS,
  now = Date.now(),
) {
  const issuedAt = Math.floor(now / 1000);
  const claims: Claims = {
    v: 1,
    sid: sessionId,
    iat: issuedAt,
    exp: issuedAt + Math.max(10, Math.min(ttlSeconds, 180)),
    nonce: randomBytes(12).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

export function verifyAttendanceToken(
  token: string,
  secret: string,
  now = Date.now(),
  skewSeconds = ATTENDANCE_TOKEN_CLOCK_SKEW_SECONDS,
) {
  if (token.length > 1500 || token.length < 20) return null;
  const [body, supplied, extra] = token.split(".");
  if (!body || !supplied || extra) return null;
  const expectedBuffer = Buffer.from(signature(body, secret));
  const suppliedBuffer = Buffer.from(supplied);
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  )
    return null;
  try {
    const claims = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<Claims>;
    const current = Math.floor(now / 1000);
    if (
      claims.v !== 1 ||
      typeof claims.sid !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(claims.sid)
    )
      return null;
    if (
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number" ||
      typeof claims.nonce !== "string"
    )
      return null;
    if (
      claims.iat > current + skewSeconds ||
      claims.exp < current - skewSeconds ||
      claims.exp <= claims.iat ||
      claims.exp - claims.iat > 180
    )
      return null;
    return claims as Claims;
  } catch {
    return null;
  }
}

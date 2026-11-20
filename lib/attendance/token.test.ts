import { describe, expect, it } from "vitest";
import { issueAttendanceToken, verifyAttendanceToken } from "./token-core";
import { ATTENDANCE_TOKEN_CLOCK_SKEW_SECONDS } from "./constants";

const sessionId = "00000000-0000-4000-8000-000000000042";
const secret = "local-test-only-secret-that-is-long-enough-123456";

describe("attendance token", () => {
  it("signs and verifies a short-lived session token", () => {
    const token = issueAttendanceToken(sessionId, secret, 40, 1_000_000);
    expect(verifyAttendanceToken(token, secret, 1_000_000)?.sid).toBe(
      sessionId,
    );
  });
  it("defaults to a 10-second token and permits only the configured clock skew", () => {
    const issuedAt = 1_000_000;
    const token = issueAttendanceToken(sessionId, secret, undefined, issuedAt);
    const claims = verifyAttendanceToken(token, secret, issuedAt);
    if (!claims) throw new Error("The freshly issued token should verify.");

    expect(claims.exp - claims.iat).toBe(10);
    expect(
      verifyAttendanceToken(
        token,
        secret,
        (claims.exp + ATTENDANCE_TOKEN_CLOCK_SKEW_SECONDS) * 1000,
      ),
    ).not.toBeNull();
    expect(
      verifyAttendanceToken(
        token,
        secret,
        (claims.exp + ATTENDANCE_TOKEN_CLOCK_SKEW_SECONDS + 1) * 1000,
      ),
    ).toBeNull();
  });
  it("rejects a token signed with a different secret or modified contents", () => {
    const token = issueAttendanceToken(sessionId, secret, 40, 1_000_000);
    expect(
      verifyAttendanceToken(
        token,
        "different-secret-that-is-long-enough-123456",
        1_000_000,
      ),
    ).toBeNull();
    expect(verifyAttendanceToken(`${token}x`, secret, 1_000_000)).toBeNull();
  });
  it("rejects expired, future-issued, and malformed tokens and caps the issued lifetime", () => {
    const token = issueAttendanceToken(sessionId, secret, 40, 1_000_000);
    expect(verifyAttendanceToken(token, secret, 1_100_000)).toBeNull();
    expect(verifyAttendanceToken(token, secret, 900_000)).toBeNull();
    expect(verifyAttendanceToken("not-a-token", secret)).toBeNull();
    const capped = verifyAttendanceToken(
      issueAttendanceToken(sessionId, secret, 400, 1_000_000),
      secret,
      1_000_000,
    );
    expect(capped?.exp).toBe(1180);
    expect(capped?.iat).toBe(1000);
  });
});

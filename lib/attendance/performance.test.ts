import { describe, expect, it } from "vitest";
import {
  buildAttendanceClaimUrl,
  formatAttendanceServerTiming,
  isAttendanceDiagnosticsEnabled,
  parseAttendanceServerTiming,
} from "./performance";

describe("isAttendanceDiagnosticsEnabled", () => {
  it("enables diagnostics only for the exact single value 1", () => {
    expect(isAttendanceDiagnosticsEnabled("1")).toBe(true);
    expect(isAttendanceDiagnosticsEnabled(undefined)).toBe(false);
    expect(isAttendanceDiagnosticsEnabled("0")).toBe(false);
    expect(isAttendanceDiagnosticsEnabled("true")).toBe(false);
    expect(isAttendanceDiagnosticsEnabled(["1"])).toBe(false);
  });
});

describe("buildAttendanceClaimUrl", () => {
  it("keeps the bearer token in the fragment and includes only the opt-in flag", () => {
    expect(
      buildAttendanceClaimUrl(
        "https://sams.example",
        "synthetic-signed-token",
        true,
      ),
    ).toBe(
      "https://sams.example/attendance/claim?diagnostics=1#token=synthetic-signed-token",
    );
  });

  it("preserves the normal claim URL when diagnostics are disabled", () => {
    expect(
      buildAttendanceClaimUrl(
        "https://sams.example",
        "synthetic-signed-token",
        false,
      ),
    ).toBe(
      "https://sams.example/attendance/claim#token=synthetic-signed-token",
    );
  });
});

describe("parseAttendanceServerTiming", () => {
  it("parses known finite durations and maps legacy app to inclusive server total", () => {
    expect(
      parseAttendanceServerTiming(
        " auth;dur=12.5, db; dur=8, app;dur=31.2, cache;dur=3 ",
      ),
    ).toEqual({ authMs: 12.5, dbMs: 8, serverTotalMs: 31.2 });
  });

  it("uses total when it is the only server total metric", () => {
    expect(
      parseAttendanceServerTiming("auth;dur=2.1,db;dur=3,total;dur=7.1"),
    ).toEqual({ authMs: 2.1, dbMs: 3, serverTotalMs: 7.1 });
  });

  it("omits an ambiguous server total when legacy app and total both appear", () => {
    expect(parseAttendanceServerTiming("app;dur=31.2,total;dur=99")).toEqual({
      authMs: undefined,
      dbMs: undefined,
      serverTotalMs: undefined,
    });
  });

  it("omits missing, malformed, negative, non-finite, or duplicate metrics", () => {
    expect(
      parseAttendanceServerTiming(
        "auth;dur=NaN, db;dur=-1, total;dur=Infinity, auth;dur=2, app;dur=3, total;dur=4",
      ),
    ).toEqual({ authMs: undefined, dbMs: undefined, serverTotalMs: undefined });
    expect(parseAttendanceServerTiming(null)).toEqual({
      authMs: undefined,
      dbMs: undefined,
      serverTotalMs: undefined,
    });
  });

  it("does not infer or combine values when server timing is unavailable", () => {
    expect(parseAttendanceServerTiming("unknown;dur=5, malformed")).toEqual({
      authMs: undefined,
      dbMs: undefined,
      serverTotalMs: undefined,
    });
  });
});

describe("formatAttendanceServerTiming", () => {
  it("emits only known finite non-negative durations with fixed precision", () => {
    expect(
      formatAttendanceServerTiming({
        authMs: 12.34,
        dbMs: 0,
        totalMs: 18,
        arbitrary: 999,
        invalid: Number.NaN,
        negative: -1,
      }),
    ).toBe("auth;dur=12.3, db;dur=0.0, total;dur=18.0");
  });

  it("returns an empty header when all values are invalid", () => {
    expect(
      formatAttendanceServerTiming({ authMs: Number.POSITIVE_INFINITY }),
    ).toBe("");
  });
});

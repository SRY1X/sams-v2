import { describe, expect, it } from "vitest";
import {
  getDateInTimeZone,
  isAcademicTermActive,
  classifySessionStartError,
} from "./session-start";

describe("attendance session start errors", () => {
  it("identifies an inactive academic term", () => {
    expect(
      classifySessionStartError({
        code: "55000",
        message: "The academic term is not active",
      }),
    ).toBe("inactive-term");
  });

  it("identifies an already-open session", () => {
    expect(
      classifySessionStartError({
        code: "55000",
        message: "An attendance session is already active for this section",
      }),
    ).toBe("already-open");
  });

  it("does not expose or classify unrelated database errors", () => {
    expect(
      classifySessionStartError({
        code: "42501",
        message: "Not authorized",
      }),
    ).toBe("unavailable");
  });
});

describe("academic term date eligibility", () => {
  it("derives the calendar date in the institution time zone", () => {
    expect(
      getDateInTimeZone(new Date("2026-11-19T18:30:00.000Z"), "Asia/Kolkata"),
    ).toBe("2026-11-20");
  });

  it("includes the first and last day of the term", () => {
    expect(isAcademicTermActive("2026-10-14", "2026-11-14", "2026-10-14")).toBe(
      true,
    );
    expect(isAcademicTermActive("2026-10-14", "2026-11-14", "2026-11-14")).toBe(
      true,
    );
  });

  it("rejects dates outside the configured term", () => {
    expect(isAcademicTermActive("2026-10-14", "2026-11-14", "2026-10-13")).toBe(
      false,
    );
    expect(isAcademicTermActive("2026-10-14", "2026-11-14", "2026-11-15")).toBe(
      false,
    );
  });
});

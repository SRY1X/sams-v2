import { describe, expect, it } from "vitest";
import { filterAttendanceByCourse, selectActiveSession } from "./dashboard";

describe("faculty dashboard session selection", () => {
  const sessions = [{ id: "first" }, { id: "second" }];

  it("keeps the requested active session selected", () => {
    expect(selectActiveSession(sessions, "second")).toEqual(sessions[1]);
  });

  it("falls back to an active session when the URL selection is stale", () => {
    expect(selectActiveSession(sessions, "closed-session")).toEqual(
      sessions[0],
    );
  });

  it("returns no session when none are active", () => {
    expect(selectActiveSession([], "closed-session")).toBeNull();
  });
});

describe("student attendance history filters", () => {
  const records = [
    { session_id: "session-a" },
    { session_id: "session-b" },
    { session_id: "session-c" },
  ];
  const sessions = new Map([
    ["session-a", { section_id: "section-a" }],
    ["session-b", { section_id: "section-b" }],
    ["session-c", { section_id: "section-missing" }],
  ]);
  const sections = new Map([
    ["section-a", { course_id: "course-a" }],
    ["section-b", { course_id: "course-b" }],
  ]);

  it("filters records to the selected course", () => {
    expect(
      filterAttendanceByCourse(records, sessions, sections, "course-b"),
    ).toEqual([records[1]]);
  });

  it("returns all records when no course filter is selected", () => {
    expect(filterAttendanceByCourse(records, sessions, sections, "")).toEqual(
      records,
    );
  });
});

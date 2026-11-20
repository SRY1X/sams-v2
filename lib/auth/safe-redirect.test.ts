import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-redirect";

describe("safe internal redirects", () => {
  it("preserves a valid app path and its query and fragment", () => {
    expect(safeInternalPath("/student/history?term=current#records")).toBe(
      "/student/history?term=current#records",
    );
  });

  it.each([
    "https://outside.example",
    "//outside.example/path",
    "/\\outside.example/path",
    "/path\n//outside.example",
    "dashboard",
  ])("uses the fallback for unsafe destination %s", (candidate) => {
    expect(safeInternalPath(candidate)).toBe("/dashboard");
  });

  it("uses a caller-provided fallback for a missing destination", () => {
    expect(safeInternalPath(null, "/login")).toBe("/login");
  });
});
